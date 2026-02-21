import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// User logs a new pending payment
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { listing_id, amount_paid, transaction_hash, memo } = await request.json();

  const { data, error } = await supabase
    .from("payment_records")
    .insert({ user_id: user.id, listing_id, amount_paid, transaction_hash, memo })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data, { status: 201 });
}

// Webhook / backend confirms or fails a payment (uses service role)
export async function PATCH(request: Request) {
  const admin = createAdminClient();
  const { transaction_hash, status } = await request.json();

  const { data, error } = await admin
    .from("payment_records")
    .update({ status })
    .eq("transaction_hash", transaction_hash)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
