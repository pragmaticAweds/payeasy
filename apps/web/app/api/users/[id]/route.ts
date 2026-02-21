import { type NextRequest } from "next/server";
import { getUserId, successResponse, errorResponse } from "@/lib/api-utils";
import { getServerClient } from "@/lib/supabase/server";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const idParam = params.id;

    // Resolve user id: "me" -> auth cookie, otherwise the path param
    const supabase = getServerClient();

    let targetId: string | null = null;
    if (idParam === "me") {
      targetId = getUserId(request) as string | null;
      if (!targetId) return errorResponse("Unauthorized", 401);
    } else {
      targetId = idParam;
    }

    // Fetch user row
    const { data: user, error: userErr } = await supabase
      .from("users")
      .select("id,username,email,public_key,avatar_url,bio,created_at")
      .eq("id", targetId)
      .maybeSingle();

    if (userErr) return errorResponse(userErr.message, 400);
    if (!user) return errorResponse("User not found", 404);

    // Count listings for the user (exclude deleted)
    const { count, error: countErr } = await supabase
      .from("listings")
      .select("id", { count: "exact", head: true })
      .eq("landlord_id", targetId)
      .neq("status", "deleted");

    const listingsCount = count ?? 0;

    // If the request asked for "me" we already enforced auth via cookie.
    // For public profiles (other users) we avoid returning email.
    const requester = getUserId(request);
    const isOwn = requester === targetId;

    const payload = {
      id: user.id,
      username: user.username,
      email: isOwn ? user.email : null,
      public_key: user.public_key,
      avatar_url: user.avatar_url,
      bio: user.bio,
      created_at: user.created_at,
      listings_count: listingsCount,
    };

    return successResponse(payload);
  } catch (err) {
    return errorResponse("Internal server error", 500);
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const idParam = params.id;
    const supabase = getServerClient();

    let targetId: string | null = null;
    if (idParam === "me") {
      targetId = getUserId(request) as string | null;
      if (!targetId) return errorResponse("Unauthorized", 401);
    } else {
      targetId = idParam;
    }

    // Only the owner may update their profile (service role can bypass)
    const requester = getUserId(request);
    if (requester !== targetId) return errorResponse("Forbidden", 403);

    const body = await request.json();
    const { username, email, avatar_url, bio } = body as {
      username?: string;
      email?: string | null;
      avatar_url?: string | null;
      bio?: string | null;
    };

    const update: Record<string, unknown> = {};
    if (typeof username === "string") update.username = username;
    if (typeof email === "string" || email === null) update.email = email;
    if (typeof avatar_url === "string" || avatar_url === null) update.avatar_url = avatar_url;
    if (typeof bio === "string" || bio === null) update.bio = bio;

    if (Object.keys(update).length === 0) return errorResponse("No valid fields to update", 400);

    const { data: updated, error: updErr } = await supabase
      .from("users")
      .update(update)
      .eq("id", targetId)
      .select("id,username,email,public_key,avatar_url,bio,created_at")
      .maybeSingle();

    if (updErr) return errorResponse(updErr.message, 400);
    if (!updated) return errorResponse("User not found", 404);

    return successResponse(updated);
  } catch (err) {
    return errorResponse("Internal server error", 500);
  }
}
