import { NextResponse } from "next/server";
import { verifyJwt } from "@/lib/auth/stellar-auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyJwt(token);
  if (!payload || !payload.sub) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const publicKey = payload.sub;
  const supabase = createAdminClient();

  // Find user by public key
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("public_key", publicKey)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found. Please complete your profile." }, { status: 404 });
  }

  try {
    const body = await request.json();
    const { listingId, amount, txHash } = body;

    const { data, error } = await supabase
      .from("payment_records")
      .insert({
        user_id: user.id,
        listing_id: listingId,
        amount_paid: amount,
        transaction_hash: txHash,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const cookieStore = cookies();
  const token = cookieStore.get("auth-token")?.value;

  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyJwt(token);
  if (!payload || !payload.sub) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const supabase = createAdminClient();

  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("payment_records")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
}
