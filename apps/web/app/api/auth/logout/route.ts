import { NextResponse } from "next/server";
import { successResponse } from "@/lib/api-utils";

/**
 * POST /api/auth/logout
 * 
 * Logs out the current user by clearing the auth-token cookie.
 * This route always succeeds, even if no user is logged in.
 */
export async function POST() {
  const response = successResponse({ message: "Logged out successfully" });
  
  // Clear the auth-token cookie by setting it with maxAge: 0
  response.cookies.set("auth-token", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0, // Expire immediately
  });
  
  return response;
}
