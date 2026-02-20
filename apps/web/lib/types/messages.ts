// ─── Database Row Types ──────────────────────────────────────────────────────

export interface Conversation {
  id: string;
  created_at: string;
  updated_at: string;
}

export interface ConversationParticipant {
  id: string;
  conversation_id: string;
  user_id: string;
  joined_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  read_at: string | null;
  deleted_at: string | null;
  created_at: string;
}

// ─── API Request Types ───────────────────────────────────────────────────────

export interface SendMessageRequest {
  recipientId: string;
  content: string;
}

// ─── API Response Types ──────────────────────────────────────────────────────

export interface ConversationPreview {
  id: string;
  created_at: string;
  updated_at: string;
  last_message: {
    content: string;
    sender_id: string;
    created_at: string;
  } | null;
  participants: {
    id: string;
    user_id: string;
  }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalCount: number;
    totalPages: number;
    hasMore: boolean;
  };
}

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
  };
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;
