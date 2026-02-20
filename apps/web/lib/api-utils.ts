import { NextResponse, type NextRequest } from "next/server";
import { verifyJwt } from "@/lib/auth/stellar-auth";

/**
 * Build a successful JSON response.
 */
export function successResponse<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status });
}

/**
 * Build an error JSON response.
 */
export function errorResponse(message: string, status = 400, code?: string) {
  return NextResponse.json(
    { success: false, error: { message, ...(code && { code }) } },
    { status }
  );
}

/**
 * Extract the authenticated user's Stellar public key from the JWT cookie.
 *
 * Returns `null` when the token is missing or invalid.
 */
export function getUserId(request: NextRequest | Request): string | null {
  // Try the auth-token cookie first (set by /api/auth/verify)
  let token: string | undefined;

  if ("cookies" in request && typeof (request as NextRequest).cookies?.get === "function") {
    token = (request as NextRequest).cookies.get("auth-token")?.value;
  }

  // Fallback: check the Authorization header (Bearer <token>)
  if (!token) {
    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      token = authHeader.slice(7);
    }
  }

  if (!token) return null;

  const payload = verifyJwt(token);
  if (!payload || typeof payload.sub !== "string") return null;

  return payload.sub;
}
