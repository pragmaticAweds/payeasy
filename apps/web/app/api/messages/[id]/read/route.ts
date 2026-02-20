import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse, getUserId } from "@/lib/api-utils";
import type { Message } from "@/lib/types/messages";

/**
 * PATCH /api/messages/[id]/read
 *
 * Mark a message as read by setting `read_at = now()`.
 * Only the recipient (i.e. NOT the sender) can mark a message as read.
 */
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. Authenticate
    const userId = getUserId(request);
    if (!userId) {
      return errorResponse("Authentication required.", 401, "UNAUTHORIZED");
    }

    const messageId = params.id;

    // 2. Fetch the message
    const { data: message, error: fetchError } = await supabase
      .from("messages")
      .select("*")
      .eq("id", messageId)
      .is("deleted_at", null)
      .single<Message>();

    if (fetchError || !message) {
      return errorResponse("Message not found.", 404, "NOT_FOUND");
    }

    // 3. Only the recipient can mark as read (not the sender)
    if (message.sender_id === userId) {
      return errorResponse("You cannot mark your own message as read.", 403, "FORBIDDEN");
    }

    // Verify the user is a participant in the conversation
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", message.conversation_id)
      .eq("user_id", userId)
      .single();

    if (!participant) {
      return errorResponse("Message not found.", 404, "NOT_FOUND");
    }

    // 4. Already read? Return as-is
    if (message.read_at) {
      return successResponse(message);
    }

    // 5. Update read_at
    const { data: updated, error: updateError } = await supabase
      .from("messages")
      .update({ read_at: new Date().toISOString() })
      .eq("id", messageId)
      .select()
      .single<Message>();

    if (updateError) {
      console.error("Failed to mark message as read:", updateError);
      return errorResponse("Failed to mark message as read.", 500, "INTERNAL_ERROR");
    }

    return successResponse(updated);
  } catch (err) {
    console.error("PATCH /api/messages/[id]/read error:", err);
    return errorResponse("Internal server error.", 500, "INTERNAL_ERROR");
  }
}
