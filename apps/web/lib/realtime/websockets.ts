import { getSupabaseClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type ConnectionStatus = "connecting" | "connected" | "disconnected" | "reconnecting";

type StatusListener = (status: ConnectionStatus) => void;
type MessageListener = (event: string, payload: Record<string, unknown>) => void;

const CHANNEL_NAME = "admin-dashboard";
const RECONNECT_DELAYS = [1000, 2000, 4000, 8000, 16000];

class RealtimeConnectionManager {
  private channel: RealtimeChannel | null = null;
  private status: ConnectionStatus = "disconnected";
  private statusListeners = new Set<StatusListener>();
  private messageListeners = new Set<MessageListener>();
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private subscriberCount = 0;

  getStatus(): ConnectionStatus {
    return this.status;
  }

  subscribe(
    onStatus: StatusListener,
    onMessage: MessageListener
  ): () => void {
    this.statusListeners.add(onStatus);
    this.messageListeners.add(onMessage);
    this.subscriberCount++;

    // Send current status immediately
    onStatus(this.status);

    // Connect if this is the first subscriber
    if (this.subscriberCount === 1) {
      this.connect();
    }

    return () => {
      this.statusListeners.delete(onStatus);
      this.messageListeners.delete(onMessage);
      this.subscriberCount--;

      if (this.subscriberCount === 0) {
        this.disconnect();
      }
    };
  }

  private setStatus(status: ConnectionStatus) {
    this.status = status;
    this.statusListeners.forEach((listener) => listener(status));
  }

  private connect() {
    if (this.channel) return;

    this.setStatus("connecting");

    const supabase = getSupabaseClient();
    const channel = supabase.channel(CHANNEL_NAME);
    this.channel = channel;

    channel
      .on("broadcast", { event: "metrics-update" }, (msg: { payload: Record<string, unknown> }) => {
        this.messageListeners.forEach((listener) =>
          listener("metrics-update", msg.payload)
        );
      })
      .on("broadcast", { event: "activity-update" }, (msg: { payload: Record<string, unknown> }) => {
        this.messageListeners.forEach((listener) =>
          listener("activity-update", msg.payload)
        );
      })
      .on("broadcast", { event: "status-update" }, (msg: { payload: Record<string, unknown> }) => {
        this.messageListeners.forEach((listener) =>
          listener("status-update", msg.payload)
        );
      })
      .subscribe((status: string) => {
        if (status === "SUBSCRIBED") {
          this.setStatus("connected");
          this.reconnectAttempt = 0;
        } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
          this.setStatus("disconnected");
          this.channel = null;
          this.scheduleReconnect();
        }
      });
  }

  private disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.channel) {
      const supabase = getSupabaseClient();
      supabase.removeChannel(this.channel);
      this.channel = null;
    }

    this.setStatus("disconnected");
    this.reconnectAttempt = 0;
  }

  private scheduleReconnect() {
    if (this.subscriberCount === 0) return;

    const delay =
      RECONNECT_DELAYS[Math.min(this.reconnectAttempt, RECONNECT_DELAYS.length - 1)];
    this.reconnectAttempt++;
    this.setStatus("reconnecting");

    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, delay);
  }
}

// Singleton instance shared across the app
export const realtimeManager = new RealtimeConnectionManager();
