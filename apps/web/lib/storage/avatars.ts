import { SupabaseClient } from "@supabase/supabase-js";

const BUCKET_NAME = "avatars";
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png"];

export interface UploadAvatarResult {
  publicUrl: string;
  path: string;
}

/**
 * Validates the avatar file for upload.
 * @throws Error if validation fails
 */
export function validateAvatarFile(file: File): void {
  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(
      `File size exceeds 5MB limit. Received: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    );
  }

  // Check file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new Error(
      `Invalid file type. Only JPEG and PNG files are allowed. Received: ${file.type}`
    );
  }
}

/**
 * Generates a unique filename for the avatar.
 */
export function generateAvatarFilename(userId: string, file: File): string {
  const ext = file.type === "image/jpeg" ? "jpg" : "png";
  const timestamp = Date.now();
  return `${userId}-${timestamp}.${ext}`;
}

/**
 * Uploads an avatar to Supabase Storage.
 * If an old avatar exists, it will be deleted first.
 *
 * @param supabase - Supabase client instance
 * @param userId - User ID
 * @param file - The avatar file to upload
 * @returns Object containing the public URL and the storage path
 */
export async function uploadAvatar(
  supabase: SupabaseClient,
  userId: string,
  file: File
): Promise<UploadAvatarResult> {
  // Validate file
  validateAvatarFile(file);

  // Convert File to Buffer for upload
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Generate filename
  const filename = generateAvatarFilename(userId, file);
  const filePath = `${userId}/${filename}`;

  try {
    // Delete old avatar(s) if they exist
    await deleteOldAvatars(supabase, userId);

    // Upload new avatar
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Failed to upload avatar: ${uploadError.message}`);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath);

    return {
      publicUrl: urlData.publicUrl,
      path: filePath,
    };
  } catch (error) {
    // Clean up the uploaded file if there's an error
    await supabase.storage.from(BUCKET_NAME).remove([filePath]).catch(() => {
      // Ignore cleanup errors
    });
    throw error;
  }
}

/**
 * Deletes all old avatar files for a user.
 */
async function deleteOldAvatars(supabase: SupabaseClient, userId: string): Promise<void> {
  try {
    // List all files in the user's avatar directory
    const { data: files, error: listError } = await supabase.storage
      .from(BUCKET_NAME)
      .list(userId);

    if (listError) {
      console.warn(`Could not list old avatars: ${listError.message}`);
      return;
    }

    if (!files || files.length === 0) {
      return; // No old avatars to delete
    }

    // Delete all old files
    const filePaths = files.map((file) => `${userId}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove(filePaths);

    if (deleteError) {
      console.warn(`Could not delete old avatars: ${deleteError.message}`);
    }
  } catch (error) {
    console.error("Error deleting old avatars:", error);
    // Don't throw - old avatar deletion failure shouldn't block new upload
  }
}

/**
 * Deletes a specific avatar file from storage.
 */
export async function deleteAvatar(supabase: SupabaseClient, filePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([filePath]);

  if (error) {
    throw new Error(`Failed to delete avatar: ${error.message}`);
  }
}

/**
 * Gets the public URL for an avatar file.
 */
export function getAvatarPublicUrl(supabase: SupabaseClient, filePath: string): string {
  const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(filePath);
  return data.publicUrl;
}
