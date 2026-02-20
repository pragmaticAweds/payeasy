import { NextRequest } from "next/server";
import { getAdminClient } from "@/lib/supabase/server";
import { getUserId, successResponse, errorResponse } from "@/lib/api-utils";
import type { User } from "@/lib/types";

/**
 * GET /api/users/me
 * 
 * Returns the current authenticated user's profile.
 * Requires valid JWT token in auth-token cookie or Authorization header.
 */
export async function GET(request: NextRequest) {
  try {
    // Extract public key from JWT token
    const publicKey = getUserId(request);
    
    if (!publicKey) {
      return errorResponse("Unauthorized - no valid token", 401, "UNAUTHORIZED");
    }
    
    // Query the user from database
    const supabase = getAdminClient();
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("public_key", publicKey)
      .single();
    
    if (error) {
      console.error("Error fetching user:", error);
      
      if (error.code === "PGRST116") {
        // No rows returned
        return errorResponse("User not found", 404, "USER_NOT_FOUND");
      }
      
      return errorResponse("Failed to fetch user", 500, "FETCH_ERROR");
    }
    
    if (!user) {
      return errorResponse("User not found", 404, "USER_NOT_FOUND");
    }
    
    return successResponse<User>(user as User);
  } catch (error) {
    console.error("Error in GET /api/users/me:", error);
    return errorResponse("Internal server error", 500, "INTERNAL_ERROR");
  }
}
