import { createClient } from "@/lib/superbase/server";
import type {
  ListingWithLandlord,
  MessageWithSender,
  PaymentRecord,
  RentAgreement,
} from "@/lib/types/superbase";

// ── Listings ─────────────────────────────────────────────

export async function getAvailableListings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*, users(username, avatar_url, public_key)")
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as ListingWithLandlord[];
}

export async function getListingById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*, users(username, avatar_url, public_key)")
    .eq("id", id)
    .single();

  if (error) throw new Error(error.message);
  return data as ListingWithLandlord;
}

export async function getMyListings(landlordId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("landlord_id", landlordId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function searchListings(query: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("listings")
    .select("*, users(username, avatar_url, public_key)")
    .eq("is_available", true)
    .or(`title.ilike.%${query}%,description.ilike.%${query}%`)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as ListingWithLandlord[];
}

// ── Messages ──────────────────────────────────────────────

export async function getInbox(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("*, sender:sender_id(username, avatar_url)")
    .eq("receiver_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as MessageWithSender[];
}

export async function getThread(userId: string, otherUserId: string, listingId?: string) {
  const supabase = await createClient();
  let query = supabase
    .from("messages")
    .select("*")
    .or(
      `and(sender_id.eq.${userId},receiver_id.eq.${otherUserId}),` +
        `and(sender_id.eq.${otherUserId},receiver_id.eq.${userId})`
    )
    .order("created_at", { ascending: true });

  if (listingId) query = query.eq("listing_id", listingId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return data;
}

export async function getUnreadCount(userId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("messages")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", userId)
    .eq("is_read", false);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

// ── Payments ──────────────────────────────────────────────

export async function getMyPayments(userId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("payment_records")
    .select("*, listings(title, address)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as (PaymentRecord & { listings: { title: string; address: string } })[];
}

// ── Rent Agreements ───────────────────────────────────────

export async function getAgreementByListing(listingId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rent_agreements")
    .select("*, users(username, public_key)")
    .eq("listing_id", listingId)
    .eq("status", "active")
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data as (RentAgreement & { users: { username: string; public_key: string } }) | null;
}

export async function getMyAgreements(tenantId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("rent_agreements")
    .select("*, listings(title, address, rent_xlm)")
    .eq("tenant_id", tenantId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data as (RentAgreement & {
    listings: { title: string; address: string; rent_xlm: number };
  })[];
}
