import { NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { uploadAvatar } from "@/lib/storage/avatars";
import { successResponse, errorResponse } from "@/lib/api-utils";

/**
 * POST /api/users/avatar/upload
 *
 * Upload a user avatar image to Supabase Storage.
 *
 * Request:
 * - Content-Type: multipart/form-data
 * - Body: FormData with 'avatar' file field
 *
 * Response (201):
 * {
 *   success: true,
 *   data: {
 *     publicUrl: "https://...",
 *     path: "userId/filename.jpg"
 *   }
 * }
 *
 * Error Responses:
 * - 401: Unauthorized (not authenticated)
 * - 400: Bad Request (missing file, invalid file type/size, etc.)
 * - 500: Internal Server Error
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return errorResponse("Unauthorized", 401);
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return errorResponse("No file provided. Expected 'avatar' field in FormData.", 400);
    }

    // Upload avatar
    const result = await uploadAvatar(supabase, user.id, file);

    return successResponse(
      {
        publicUrl: result.publicUrl,
        path: result.path,
      },
      201
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error occurred";

    // Determine if it's a validation error (client error) or server error
    if (message.includes("exceeds") || message.includes("Invalid file type")) {
      return errorResponse(message, 400);
    }

    console.error("Avatar upload error:", error);
    return errorResponse("Failed to upload avatar", 500);
  }
}
