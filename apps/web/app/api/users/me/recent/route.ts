import { NextResponse } from "next/server";
import { getServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = getServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Since Supabase JS client doesn't explicitly support `DISTINCT ON`,
    // and we are limiting to 50, we can fetch the user's latest views,
    // order by viewed_at DESC, and deduplicate in memory to yield the recent 50.
    // Fetching 200 items gives us a reasonable buffer to find 50 distinct items.

    const { data: historyData, error: historyError } = await supabase
      .from("user_view_history")
      .select("listing_id, viewed_at")
      .eq("user_id", user.id)
      .order("viewed_at", { ascending: false })
      .limit(300);

    if (historyError) {
      console.error("Failed to fetch history:", historyError);
      return NextResponse.json({ error: "Failed to fetch views" }, { status: 500 });
    }

    if (!historyData || historyData.length === 0) {
      return NextResponse.json({ data: [] }, { status: 200 });
    }

    // Deduplicate in memory
    const seenListingIds = new Set<string>();
    const distinctViews: { listing_id: string; viewed_at: string }[] = [];

    for (const view of historyData) {
      if (!seenListingIds.has(view.listing_id)) {
        seenListingIds.add(view.listing_id);
        distinctViews.push(view);
      }
      if (distinctViews.length >= 50) break; // Limit to 50
    }

    // We have our distinct 50 views. Now we fetch the actual listing details.
    // If listings don't exist anymore, they won't be returned.
    const listingIdsToFetch = distinctViews.map((v) => v.listing_id);

    const { data: listingsData, error: listingsError } = await supabase
      .from("listings")
      .select(
        `
        id, title, description, address, rent_xlm, bedrooms, bathrooms, status,
        listing_images (
          image_url
        )
      `
      )
      .in("id", listingIdsToFetch);

    if (listingsError) {
      console.error("Failed to fetch listings data:", listingsError);
      return NextResponse.json({ error: "Failed to fetch listing details" }, { status: 500 });
    }

    // Merge the listing data with the viewed_at timestamps and maintain the `viewed_at` order
    const listingsMap = new Map(listingsData?.map((l) => [l.id, l]) || []);

    const resultingListings = distinctViews
      .map((view) => {
        const listing = listingsMap.get(view.listing_id);
        if (!listing) return null;
        return {
          ...listing,
          viewed_at: view.viewed_at,
        };
      })
      .filter(Boolean); // Filter out any deleted listings

    return NextResponse.json({ data: resultingListings }, { status: 200 });
  } catch (error) {
    console.error("Recent views error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
