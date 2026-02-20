import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse, getUserId } from "@/lib/api-utils";
import type { Message } from "@/lib/types/messages";

/**
 * DELETE /api/messages/[id]
 *
 * Soft-delete a message by setting `deleted_at = now()`.
 * Only the original sender may delete their own message.
 */
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
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

    // 3. Only the sender can delete their own message
    if (message.sender_id !== userId) {
      return errorResponse("You can only delete your own messages.", 403, "FORBIDDEN");
    }

    // 4. Soft-delete
    const { data: deleted, error: deleteError } = await supabase
      .from("messages")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", messageId)
      .select()
      .single<Message>();

    if (deleteError) {
      console.error("Failed to delete message:", deleteError);
      return errorResponse("Failed to delete message.", 500, "INTERNAL_ERROR");
    }

    return successResponse(deleted);
  } catch (err) {
    console.error("DELETE /api/messages/[id] error:", err);
    return errorResponse("Internal server error.", 500, "INTERNAL_ERROR");
  }
}
