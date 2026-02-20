import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse, getUserId } from "@/lib/api-utils";
import { validateSendMessage } from "@/lib/validators/messages";
import type { Message } from "@/lib/types/messages";

/**
 * POST /api/messages/send
 *
 * Send a new message. Auto-creates a conversation between the two
 * users if one does not already exist.
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate
    const senderId = getUserId(request);
    if (!senderId) {
      return errorResponse("Authentication required.", 401, "UNAUTHORIZED");
    }

    // 2. Parse & validate body
    const body = await request.json().catch(() => null);
    if (!body) {
      return errorResponse("Invalid JSON body.", 400, "INVALID_BODY");
    }

    const validation = validateSendMessage(body, senderId);
    if (validation.errors) {
      return errorResponse(
        validation.errors.map((e) => `${e.field}: ${e.message}`).join("; "),
        400,
        "VALIDATION_ERROR"
      );
    }

    const { recipientId, content } = validation.data!;

    // 3. Find or create conversation between the two users
    const conversationId = await findOrCreateConversation(senderId, recipientId);

    // 4. Insert message
    const { data: message, error: msgError } = await supabase
      .from("messages")
      .insert({
        conversation_id: conversationId,
        sender_id: senderId,
        content,
      })
      .select()
      .single<Message>();

    if (msgError) {
      console.error("Failed to insert message:", msgError);
      return errorResponse("Failed to send message.", 500, "INTERNAL_ERROR");
    }

    return successResponse(message, 201);
  } catch (err) {
    console.error("POST /api/messages/send error:", err);
    return errorResponse("Internal server error.", 500, "INTERNAL_ERROR");
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Find an existing 1-on-1 conversation between two users, or create one.
 */
async function findOrCreateConversation(userA: string, userB: string): Promise<string> {
  // Look for a conversation where BOTH users are participants
  const { data: existing } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userA);

  if (existing && existing.length > 0) {
    const conversationIds = existing.map((r) => r.conversation_id);

    const { data: match } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", userB)
      .in("conversation_id", conversationIds);

    if (match && match.length > 0) {
      return match[0].conversation_id;
    }
  }

  // No existing conversation — create one
  const { data: conv, error: convError } = await supabase
    .from("conversations")
    .insert({})
    .select()
    .single();

  if (convError || !conv) {
    throw new Error(`Failed to create conversation: ${convError?.message}`);
  }

  const { error: partError } = await supabase.from("conversation_participants").insert([
    { conversation_id: conv.id, user_id: userA },
    { conversation_id: conv.id, user_id: userB },
  ]);

  if (partError) {
    throw new Error(`Failed to add participants: ${partError.message}`);
  }

  return conv.id;
}
