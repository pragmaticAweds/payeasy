"use client";

import React from "react";
import { StatCard } from "@/components/dashboard/StatCard";
import { QuickActionCard } from "@/components/dashboard/QuickActionCard";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { StatusIndicator, StatusType } from "@/components/StatusIndicator";
import { Skeleton } from "@/components/ui/Skeleton";
import { useRealtimeDashboard } from "@/hooks/useRealtimeDashboard";
import type { ConnectionStatus } from "@/lib/realtime/websockets";
import {
  Users,
  Home,
  CreditCard,
  Activity as ActivityIcon,
  Settings,
  Eye,
  UserCog,
  RefreshCw,
  Wifi,
  WifiOff,
} from "lucide-react";

type SystemStatusKey = "database" | "blockchain" | "authentication" | "payments";

function getStatusType(status: string): StatusType {
  switch (status) {
    case "operational":
      return "success";
    case "degraded":
      return "warning";
    case "down":
      return "error";
    default:
      return "info";
  }
}

const systemServiceLabels: Record<SystemStatusKey, string> = {
  database: "Database",
  blockchain: "Blockchain",
  authentication: "Authentication",
  payments: "Payment Gateway",
};

function ConnectionStatusBadge({ status }: { status: ConnectionStatus }) {
  const config: Record<
    ConnectionStatus,
    { label: string; dotClass: string; textClass: string }
  > = {
    connected: {
      label: "Live",
      dotClass: "bg-green-500",
      textClass: "text-green-400",
    },
    connecting: {
      label: "Connecting",
      dotClass: "bg-yellow-500",
      textClass: "text-yellow-400",
    },
    reconnecting: {
      label: "Reconnecting",
      dotClass: "bg-yellow-500 animate-pulse",
      textClass: "text-yellow-400",
    },
    disconnected: {
      label: "Offline",
      dotClass: "bg-red-500",
      textClass: "text-red-400",
    },
  };

  const { label, dotClass, textClass } = config[status];
  const Icon = status === "connected" ? Wifi : WifiOff;

  return (
    <div className="flex items-center gap-2" role="status" aria-label={`Connection: ${label}`}>
      <span className="relative flex h-2.5 w-2.5">
        {status === "connected" && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
        )}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${dotClass}`} />
      </span>
      <Icon className={`h-3.5 w-3.5 ${textClass}`} />
      <span className={`text-xs font-medium ${textClass}`}>{label}</span>
    </div>
  );
}

export default function RealtimeDashboard() {
  const { data, error, isLoading, connectionStatus, lastUpdated, refresh } =
    useRealtimeDashboard();

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 flex items-center justify-center min-h-screen">
        <div className="glass-card p-6 text-center border-red-500/20 max-w-md">
          <WifiOff className="h-10 w-10 text-red-400 mx-auto mb-3" />
          <p className="text-red-400 mb-4">
            Failed to load admin dashboard data. Please try again later.
          </p>
          <button
            onClick={refresh}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/10 hover:bg-white/20 rounded-lg transition"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white via-white to-primary/80 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-400 mt-1">{currentDate}</p>
          </div>
          <div className="flex items-center gap-4">
            <ConnectionStatusBadge status={connectionStatus} />
            {lastUpdated && (
              <span className="text-xs text-gray-500 hidden sm:inline">
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={refresh}
              className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition"
              aria-label="Refresh dashboard"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {isLoading ? (
            <>
              <Skeleton className="h-32 w-full bg-white/5 dark:bg-white/5 border border-white/5 rounded-xl" />
              <Skeleton className="h-32 w-full bg-white/5 dark:bg-white/5 border border-white/5 rounded-xl" />
              <Skeleton className="h-32 w-full bg-white/5 dark:bg-white/5 border border-white/5 rounded-xl" />
              <Skeleton className="h-32 w-full bg-white/5 dark:bg-white/5 border border-white/5 rounded-xl" />
            </>
          ) : (
            <>
              <StatCard
                title="Total Users"
                value={data?.stats.totalUsers || 0}
                description="Registered accounts"
                icon={Users}
                className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-none hover:shadow-none glass-glow"
              />
              <StatCard
                title="Active Listings"
                value={data?.stats.activeListings || 0}
                description="Published properties"
                icon={Home}
                className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-none hover:shadow-none glass-glow"
              />
              <StatCard
                title="Total Payments"
                value={data?.stats.totalPayments || 0}
                description="Processed transactions"
                icon={CreditCard}
                className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-none hover:shadow-none glass-glow"
              />
              <StatCard
                title="Revenue"
                value={data?.stats.revenue || "$0"}
                description="Total platform revenue"
                icon={ActivityIcon}
                className="bg-white/5 backdrop-blur-xl border border-white/10 shadow-none hover:shadow-none glass-glow"
              />
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="glass-card glass-glow admin-quick-action">
              <QuickActionCard
                title="Manage Users"
                description="View and manage user accounts"
                href="/admin/users"
                icon={UserCog}
              />
            </div>
            <div className="glass-card glass-glow admin-quick-action">
              <QuickActionCard
                title="Manage Listings"
                description="Review and moderate listings"
                href="/admin/listings"
                icon={Home}
              />
            </div>
            <div className="glass-card glass-glow admin-quick-action">
              <QuickActionCard
                title="View Payments"
                description="Monitor payment transactions"
                href="/admin/payments"
                icon={Eye}
              />
            </div>
            <div className="glass-card glass-glow admin-quick-action">
              <QuickActionCard
                title="System Settings"
                description="Configure platform settings"
                href="/admin/settings"
                icon={Settings}
              />
            </div>
          </div>
        </div>

        {/* Recent Activity + System Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            {isLoading ? (
              <Skeleton className="h-96 w-full bg-white/5 dark:bg-white/5 border border-white/5 rounded-xl" />
            ) : (
              <div className="glass-card glass-glow overflow-hidden admin-activity">
                <RecentActivity activities={data?.recentActivities || []} />
              </div>
            )}
          </div>

          {/* System Status */}
          <div className="lg:col-span-1">
            {isLoading ? (
              <Skeleton className="h-96 w-full bg-white/5 dark:bg-white/5 border border-white/5 rounded-xl" />
            ) : (
              <div className="glass-card glass-glow p-6 h-full">
                <h2 className="text-lg font-semibold text-white mb-6">System Status</h2>
                <div className="space-y-4">
                  {data?.systemStatus &&
                    (
                      Object.entries(data.systemStatus) as [SystemStatusKey, string][]
                    ).map(([key, status]) => (
                      <div
                        key={key}
                        className="flex items-center justify-between py-2 border-b border-white/10 last:border-0"
                      >
                        <span className="text-sm font-medium text-gray-300">
                          {systemServiceLabels[key]}
                        </span>
                        <StatusIndicator
                          status={getStatusType(status)}
                          label={status.charAt(0).toUpperCase() + status.slice(1)}
                          size="sm"
                        />
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
