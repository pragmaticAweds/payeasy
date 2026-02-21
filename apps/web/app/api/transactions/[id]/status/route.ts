import { NextResponse } from "next/server";
import { Horizon } from "stellar-sdk";
import { createClient } from "@/lib/supabase/server";
import { getStellarNetworkConfig } from "@/lib/stellar/network";
import type { ContractTransactionStatus } from "@/lib/types/supabase";

function resolveOnchainStatus(successful: boolean): ContractTransactionStatus {
  return successful ? "success" : "failed";
}

function isNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const normalizedMessage = error.message.toLowerCase();
  return normalizedMessage.includes("404") || normalizedMessage.includes("not found");
}

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: existing, error: fetchError } = await supabase
    .from("contract_transactions")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !existing) {
    return NextResponse.json({ error: fetchError?.message ?? "Transaction not found" }, { status: 404 });
  }

  if (!existing.tx_hash) {
    return NextResponse.json({
      id: existing.id,
      status: existing.status,
      tx_hash: null,
      onchain_status: "not_submitted",
    });
  }

  const networkConfig = getStellarNetworkConfig(existing.network);
  const horizonServer = new Horizon.Server(networkConfig.horizonUrl);

  try {
    const horizonTransaction = await horizonServer
      .transactions()
      .transaction(existing.tx_hash)
      .call();

    const resolvedStatus = resolveOnchainStatus(Boolean(horizonTransaction.successful));

    const mergedMetadata = {
      ...(typeof existing.metadata === "object" && existing.metadata !== null ? existing.metadata : {}),
      last_horizon_check_at: new Date().toISOString(),
      horizon_envelope_xdr: horizonTransaction.envelope_xdr,
      horizon_result_xdr: horizonTransaction.result_xdr,
      horizon_ledger: horizonTransaction.ledger,
      horizon_successful: Boolean(horizonTransaction.successful),
    };

    const updates: Record<string, unknown> = {
      metadata: mergedMetadata,
      result_xdr: horizonTransaction.result_xdr ?? existing.result_xdr,
    };

    if (existing.status !== resolvedStatus) {
      updates.status = resolvedStatus;
    }

    const { data: updated, error: updateError } = await supabase
      .from("contract_transactions")
      .update(updates)
      .eq("id", params.id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({
      id: updated.id,
      status: updated.status,
      tx_hash: updated.tx_hash,
      onchain_status: resolvedStatus,
      ledger: horizonTransaction.ledger,
      successful: Boolean(horizonTransaction.successful),
    });
  } catch (error) {
    if (isNotFoundError(error)) {
      return NextResponse.json({
        id: existing.id,
        status: existing.status,
        tx_hash: existing.tx_hash,
        onchain_status: "pending",
      });
    }

    const message = error instanceof Error ? error.message : "Failed to fetch on-chain status";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
