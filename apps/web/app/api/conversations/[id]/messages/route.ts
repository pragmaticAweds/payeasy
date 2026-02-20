import { NextRequest } from "next/server";
import { supabase } from "@/lib/supabase";
import { successResponse, errorResponse, getUserId } from "@/lib/api-utils";
import { validatePagination } from "@/lib/validators/messages";
import type { Message, PaginatedResponse } from "@/lib/types/messages";

/**
 * GET /api/conversations/[id]/messages?page=1&pageSize=20
 *
 * Retrieve paginated message history for a conversation.
 * Results are returned newest-first (ORDER BY created_at DESC).
 * Only participants of the conversation may access it.
 */
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    // 1. Authenticate
    const userId = getUserId(request);
    if (!userId) {
      return errorResponse("Authentication required.", 401, "UNAUTHORIZED");
    }

    const conversationId = params.id;

    // 2. Verify participation
    const { data: participant } = await supabase
      .from("conversation_participants")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("user_id", userId)
      .single();

    if (!participant) {
      return errorResponse("Conversation not found or access denied.", 404, "NOT_FOUND");
    }

    // 3. Validate pagination
    const searchParams = request.nextUrl.searchParams;
    const pagination = validatePagination({
      page: searchParams.get("page"),
      pageSize: searchParams.get("pageSize"),
    });

    if (pagination.errors) {
      return errorResponse(
        pagination.errors.map((e) => `${e.field}: ${e.message}`).join("; "),
        400,
        "VALIDATION_ERROR"
      );
    }

    const { page, pageSize, offset } = pagination.data!;

    // 4. Count total (non-deleted) messages
    const { count: totalCount, error: countError } = await supabase
      .from("messages")
      .select("*", { count: "exact", head: true })
      .eq("conversation_id", conversationId)
      .is("deleted_at", null);

    if (countError) {
      console.error("Failed to count messages:", countError);
      return errorResponse("Failed to load messages.", 500, "INTERNAL_ERROR");
    }

    const total = totalCount ?? 0;
    const totalPages = Math.ceil(total / pageSize);

    // 5. Fetch page
    const { data: messages, error: msgError } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (msgError) {
      console.error("Failed to fetch messages:", msgError);
      return errorResponse("Failed to load messages.", 500, "INTERNAL_ERROR");
    }

    const response: PaginatedResponse<Message> = {
      data: (messages as Message[]) ?? [],
      pagination: {
        page,
        pageSize,
        totalCount: total,
        totalPages,
        hasMore: page < totalPages,
      },
    };

    return successResponse(response);
  } catch (err) {
    console.error("GET /api/conversations/[id]/messages error:", err);
    return errorResponse("Internal server error.", 500, "INTERNAL_ERROR");
  }
}
