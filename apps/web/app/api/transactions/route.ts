import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { ContractTransactionStatus } from "@/lib/types/supabase";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

const CONTRACT_TRANSACTION_STATUSES: ContractTransactionStatus[] = [
  "pending_signature",
  "signed",
  "submitted",
  "pending",
  "success",
  "failed",
  "cancelled",
];

const STATUS_SET = new Set<string>(CONTRACT_TRANSACTION_STATUSES);

function parseStatus(value: unknown): ContractTransactionStatus | null {
  if (typeof value !== "string") {
    return null;
  }

  return STATUS_SET.has(value) ? (value as ContractTransactionStatus) : null;
}

function isJsonObject(value: unknown): value is Record<string, JsonValue> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeOptionalString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeOptionalNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }

  return value;
}

function clampLimit(rawValue: string | null): number {
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) {
    return 20;
  }

  return Math.min(100, Math.max(1, Math.trunc(parsed)));
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(request.url);
  const limit = clampLimit(url.searchParams.get("limit"));
  const listingId = sanitizeOptionalString(url.searchParams.get("listing_id"));
  const status = parseStatus(url.searchParams.get("status"));

  let query = supabase
    .from("contract_transactions")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (listingId) {
    query = query.eq("listing_id", listingId);
  }

  if (status) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const contractId = sanitizeOptionalString(body?.contract_id);
  const method = sanitizeOptionalString(body?.method);
  const walletAddress = sanitizeOptionalString(body?.wallet_address);
  const network = sanitizeOptionalString(body?.network) ?? "testnet";
  const status = parseStatus(body?.status) ?? "pending_signature";

  if (!contractId || !method || !walletAddress) {
    return NextResponse.json(
      { error: "contract_id, method, and wallet_address are required" },
      { status: 400 }
    );
  }

  const insertPayload = {
    user_id: user.id,
    listing_id: sanitizeOptionalString(body?.listing_id),
    contract_id: contractId,
    method,
    wallet_address: walletAddress,
    network,
    status,
    tx_hash: sanitizeOptionalString(body?.tx_hash),
    fee_stroops: sanitizeOptionalNumber(body?.fee_stroops),
    gas_estimate: sanitizeOptionalNumber(body?.gas_estimate),
    request_xdr: sanitizeOptionalString(body?.request_xdr),
    signed_xdr: sanitizeOptionalString(body?.signed_xdr),
    result_xdr: sanitizeOptionalString(body?.result_xdr),
    error_message: sanitizeOptionalString(body?.error_message),
    metadata: isJsonObject(body?.metadata) ? body.metadata : {},
  };

  const { data, error } = await supabase
    .from("contract_transactions")
    .insert(insertPayload)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const id = sanitizeOptionalString(body?.id);

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};

  const status = parseStatus(body?.status);
  if (status) {
    updates.status = status;
  }

  const txHash = sanitizeOptionalString(body?.tx_hash);
  if (txHash !== null) {
    updates.tx_hash = txHash;
  }

  const feeStroops = sanitizeOptionalNumber(body?.fee_stroops);
  if (feeStroops !== null) {
    updates.fee_stroops = feeStroops;
  }

  const gasEstimate = sanitizeOptionalNumber(body?.gas_estimate);
  if (gasEstimate !== null) {
    updates.gas_estimate = gasEstimate;
  }

  const requestXdr = sanitizeOptionalString(body?.request_xdr);
  if (requestXdr !== null) {
    updates.request_xdr = requestXdr;
  }

  const signedXdr = sanitizeOptionalString(body?.signed_xdr);
  if (signedXdr !== null) {
    updates.signed_xdr = signedXdr;
  }

  const resultXdr = sanitizeOptionalString(body?.result_xdr);
  if (resultXdr !== null) {
    updates.result_xdr = resultXdr;
  }

  const errorMessage = sanitizeOptionalString(body?.error_message);
  if (errorMessage !== null) {
    updates.error_message = errorMessage;
  }

  if (isJsonObject(body?.metadata)) {
    updates.metadata = body.metadata;
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No valid fields to update" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("contract_transactions")
    .update(updates)
    .eq("id", id)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json(data);
}
