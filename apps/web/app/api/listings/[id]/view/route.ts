import { NextRequest, NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const listingId = params.id;
    if (!listingId) {
      return NextResponse.json({ error: "Listing ID is required" }, { status: 400 });
    }

    const supabase = getServerClient();

    // Check if the user is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // We only log to the database if the user is authenticated.
    // Anonymous users are tracked strictly via localStorage on the client.
    if (!user) {
      return NextResponse.json(
        { message: "Anonymous view, local tracking assumed" },
        { status: 200 }
      );
    }

    // Insert view history.
    // In PostgreSQL, we can simply insert a new row to let viewed_at be the current timestamp.
    // We will extract latest view via DISTINCT ON queries later.
    const { error } = await supabase.from("user_view_history").insert({
      user_id: user.id,
      listing_id: listingId,
      // viewed_at defaults to now()
    });

    if (error) {
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to record view" }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error("View log error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
