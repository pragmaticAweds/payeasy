const MIN_CONTENT_LENGTH = 1;
const MAX_CONTENT_LENGTH = 5000;
const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidatedSendMessage {
  recipientId: string;
  content: string;
}

export interface ValidatedPagination {
  page: number;
  pageSize: number;
  offset: number;
}

/**
 * Validates the body of a POST /api/messages/send request.
 * Returns either a validated payload or an array of errors.
 */
export function validateSendMessage(
  body: Record<string, unknown>,
  senderId: string
): { data?: ValidatedSendMessage; errors?: ValidationError[] } {
  const errors: ValidationError[] = [];

  // --- content ---
  const content = typeof body.content === "string" ? body.content.trim() : undefined;
  if (!content) {
    errors.push({ field: "content", message: "Content is required." });
  } else if (content.length < MIN_CONTENT_LENGTH) {
    errors.push({
      field: "content",
      message: `Content must be at least ${MIN_CONTENT_LENGTH} character(s).`,
    });
  } else if (content.length > MAX_CONTENT_LENGTH) {
    errors.push({
      field: "content",
      message: `Content must be at most ${MAX_CONTENT_LENGTH} characters.`,
    });
  }

  // --- recipientId ---
  const recipientId = typeof body.recipientId === "string" ? body.recipientId.trim() : undefined;
  if (!recipientId) {
    errors.push({
      field: "recipientId",
      message: "Recipient ID is required.",
    });
  } else if (recipientId === senderId) {
    errors.push({
      field: "recipientId",
      message: "You cannot send a message to yourself.",
    });
  }

  if (errors.length > 0) {
    return { errors };
  }

  return { data: { recipientId: recipientId!, content: content! } };
}

/**
 * Validates and normalizes pagination query parameters.
 */
export function validatePagination(params: { page?: string | null; pageSize?: string | null }): {
  data?: ValidatedPagination;
  errors?: ValidationError[];
} {
  const errors: ValidationError[] = [];

  const page = params.page ? parseInt(params.page, 10) : 1;
  const pageSize = params.pageSize ? parseInt(params.pageSize, 10) : DEFAULT_PAGE_SIZE;

  if (isNaN(page) || page < 1) {
    errors.push({
      field: "page",
      message: "Page must be a positive integer.",
    });
  }

  if (isNaN(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    errors.push({
      field: "pageSize",
      message: `Page size must be between 1 and ${MAX_PAGE_SIZE}.`,
    });
  }

  if (errors.length > 0) {
    return { errors };
  }

  return {
    data: {
      page,
      pageSize,
      offset: (page - 1) * pageSize,
    },
  };
}
