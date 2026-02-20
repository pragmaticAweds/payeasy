import { NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase/server";
import { successResponse, errorResponse } from "@/lib/api-utils";
import type { User, UserInsert } from "@/lib/types";

/**
 * POST /api/users/register
 * 
 * Creates a new user account.
 * 
 * Request body:
 * {
 *   public_key: string (required)
 *   username: string (required)
 *   email?: string (optional)
 *   avatar_url?: string (optional)
 *   bio?: string (optional)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { public_key, username, email, avatar_url, bio } = body;
    
    // Validate required fields
    if (!public_key || typeof public_key !== "string") {
      return errorResponse("public_key is required", 400, "MISSING_PUBLIC_KEY");
    }
    
    if (!username || typeof username !== "string") {
      return errorResponse("username is required", 400, "MISSING_USERNAME");
    }
    
    // Validate username format (alphanumeric, underscores, hyphens, 3-30 chars)
    const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
    if (!usernameRegex.test(username)) {
      return errorResponse(
        "Username must be 3-30 characters and contain only letters, numbers, underscores, and hyphens",
        400,
        "INVALID_USERNAME"
      );
    }
    
    // Validate email format if provided
    if (email && typeof email === "string") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return errorResponse("Invalid email format", 400, "INVALID_EMAIL");
      }
    }
    
    const supabase = getAdminClient();
    
    // Check if user with this public key already exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("public_key", public_key)
      .single();
    
    if (existingUser) {
      return errorResponse(
        "User with this public key already exists",
        409,
        "USER_EXISTS"
      );
    }
    
    // Check if username is already taken
    const { data: existingUsername } = await supabase
      .from("users")
      .select("id")
      .eq("username", username)
      .single();
    
    if (existingUsername) {
      return errorResponse(
        "Username is already taken",
        409,
        "USERNAME_TAKEN"
      );
    }
    
    // Create the user
    const userData = {
      public_key,
      username,
      email: email || null,
      avatar_url: avatar_url || null,
      bio: bio || null,
    };
    
    const { data: newUser, error } = await (supabase
      .from("users")
      .insert(userData as any) as any)
      .select()
      .single();
    
    if (error) {
      console.error("Error creating user:", error);
      return errorResponse("Failed to create user", 500, "CREATE_ERROR");
    }
    
    if (!newUser) {
      return errorResponse("Failed to create user", 500, "CREATE_ERROR");
    }
    
    return successResponse<User>(newUser as User, 201);
  } catch (error) {
    console.error("Error in POST /api/users/register:", error);
    return errorResponse("Internal server error", 500, "INTERNAL_ERROR");
  }
}
