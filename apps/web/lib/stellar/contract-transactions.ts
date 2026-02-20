"use client";

import { signTransaction as freighterSignTransaction } from "@stellar/freighter-api";
import {
  BASE_FEE,
  Contract,
  Horizon,
  SorobanRpc,
  TransactionBuilder,
  nativeToScVal,
  type xdr,
} from "stellar-sdk";
import { getStellarNetworkConfig, type StellarNetworkName } from "@/lib/stellar/network";
import type { ContractTransactionStatus } from "@/lib/types/superbase";

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue };

export type GasEstimate = {
  stroops: number;
  source: "soroban_estimateGas" | "simulateTransaction";
  cpuInstructions?: number;
  readBytes?: number;
  writeBytes?: number;
};

export type BuildContractTransactionParams = {
  sourcePublicKey: string;
  contractId: string;
  method: string;
  args?: unknown[];
  network?: StellarNetworkName | string;
  rpcUrl?: string;
  networkPassphrase?: string;
  timeoutSeconds?: number;
};

export type BuiltContractTransaction = {
  unsignedXdr: string;
  feeStroops: number;
  gasEstimate: GasEstimate | null;
  network: StellarNetworkName;
  networkPassphrase: string;
  rpcUrl: string;
};

export type SubmittedTransaction = {
  txHash: string;
  status: string;
  errorResultXdr?: string;
};

export type TrackedStatus = {
  status: ContractTransactionStatus;
  onchainStatus: "pending" | "not_submitted" | "success" | "failed";
  txHash: string | null;
  ledger?: number;
};

export type ExecuteContractTransactionParams = BuildContractTransactionParams & {
  listingId?: string;
  metadata?: Record<string, JsonValue>;
};

export type ExecuteContractTransactionResult = {
  historyId: string;
  txHash: string;
  build: BuiltContractTransaction;
  submit: SubmittedTransaction;
};

export class FreighterSigningCancelledError extends Error {
  code = "FREIGHTER_SIGNING_CANCELLED" as const;

  constructor(message = "Transaction signing was cancelled by the user.") {
    super(message);
    this.name = "FreighterSigningCancelledError";
  }
}

function normalizeFreighterError(error: unknown): Error {
  if (error instanceof Error) {
    const lowered = error.message.toLowerCase();
    if (
      lowered.includes("cancel") ||
      lowered.includes("declined") ||
      lowered.includes("reject") ||
      lowered.includes("denied")
    ) {
      return new FreighterSigningCancelledError();
    }

    return error;
  }

  return new Error("Freighter signing failed.");
}

function toScValArgument(value: unknown): xdr.ScVal {
  if (value && typeof value === "object" && "switch" in (value as Record<string, unknown>)) {
    return value as xdr.ScVal;
  }

  return nativeToScVal(value) as xdr.ScVal;
}

function createSorobanServer(rpcUrl: string) {
  return new SorobanRpc.Server(rpcUrl, {
    allowHttp: rpcUrl.startsWith("http://"),
  });
}

function extractGasFromSimulation(simulation: {
  minResourceFee?: string | number;
  transactionData?: unknown;
}): GasEstimate | null {
  const minResourceFee = Number(simulation.minResourceFee ?? 0);
  if (!Number.isFinite(minResourceFee) || minResourceFee <= 0) {
    return null;
  }

  const transactionData = simulation.transactionData as
    | {
        resources?: () => {
          instructions?: () => unknown;
          readBytes?: () => unknown;
          writeBytes?: () => unknown;
        };
      }
    | undefined;

  return {
    stroops: minResourceFee,
    source: "simulateTransaction",
    cpuInstructions: Number(transactionData?.resources()?.instructions() ?? 0),
    readBytes: Number(transactionData?.resources()?.readBytes() ?? 0),
    writeBytes: Number(transactionData?.resources()?.writeBytes() ?? 0),
  };
}

async function estimateGasViaRpcMethod(rpcUrl: string, transactionXdr: string): Promise<GasEstimate | null> {
  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "payeasy-estimate-gas",
        method: "soroban_estimateGas",
        params: {
          transaction: transactionXdr,
        },
      }),
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as {
      result?: {
        minResourceFee?: string | number;
      };
    };

    const estimate = Number(payload.result?.minResourceFee ?? 0);
    if (!Number.isFinite(estimate) || estimate <= 0) {
      return null;
    }

    return {
      stroops: estimate,
      source: "soroban_estimateGas",
    };
  } catch {
    return null;
  }
}

function hashTransaction(transaction: { hash: () => Uint8Array }): string {
  const rawHash = transaction.hash();
  return Array.from(rawHash)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function buildContractTransaction(
  params: BuildContractTransactionParams
): Promise<BuiltContractTransaction> {
  const networkConfig = getStellarNetworkConfig(params.network);
  const rpcUrl = params.rpcUrl ?? networkConfig.sorobanRpcUrl;
  const networkPassphrase = params.networkPassphrase ?? networkConfig.networkPassphrase;

  const server = createSorobanServer(rpcUrl);
  const account = await server.getAccount(params.sourcePublicKey);
  const contract = new Contract(params.contractId);

  const args = (params.args ?? []).map((arg) => toScValArgument(arg));

  const initialTransaction = new TransactionBuilder(account, {
    fee: BASE_FEE,
    networkPassphrase,
  })
    .addOperation(contract.call(params.method, ...args))
    .setTimeout(params.timeoutSeconds ?? 60)
    .build();

  const simulation = await server.simulateTransaction(initialTransaction);
  const simulationGasEstimate = extractGasFromSimulation(simulation);
  const rpcGasEstimate = await estimateGasViaRpcMethod(rpcUrl, initialTransaction.toXDR());

  const rpcWithAssembler = SorobanRpc as unknown as {
    assembleTransaction?: (
      transaction: typeof initialTransaction,
      simulateResponse: typeof simulation
    ) => { build: () => typeof initialTransaction };
  };

  const prepareTransaction = (server as unknown as {
    prepareTransaction?: (transaction: typeof initialTransaction) => Promise<typeof initialTransaction>;
  }).prepareTransaction;

  const preparedTransaction =
    typeof rpcWithAssembler.assembleTransaction === "function"
      ? rpcWithAssembler.assembleTransaction(initialTransaction, simulation).build()
      : typeof prepareTransaction === "function"
        ? await prepareTransaction(initialTransaction)
        : (() => {
            throw new Error("Soroban transaction assembly is unavailable for this stellar-sdk version.");
          })();

  return {
    unsignedXdr: preparedTransaction.toXDR(),
    feeStroops: Number(preparedTransaction.fee),
    gasEstimate: rpcGasEstimate ?? simulationGasEstimate,
    network: networkConfig.name,
    networkPassphrase,
    rpcUrl,
  };
}

export async function signContractTransaction(
  unsignedXdr: string,
  networkPassphrase: string
): Promise<string> {
  try {
    const signed = await freighterSignTransaction(unsignedXdr, {
      networkPassphrase,
    });

    if (typeof signed === "string") {
      return signed;
    }

    if (signed && typeof signed === "object") {
      if ("error" in signed && typeof signed.error === "string" && signed.error.length > 0) {
        throw new Error(signed.error);
      }

      if ("signedTxXdr" in signed && typeof signed.signedTxXdr === "string") {
        return signed.signedTxXdr;
      }
    }

    throw new Error("Freighter returned an unexpected signing response.");
  } catch (error) {
    throw normalizeFreighterError(error);
  }
}

export async function submitSignedContractTransaction(
  signedXdr: string,
  networkPassphrase: string,
  rpcUrl: string
): Promise<SubmittedTransaction> {
  const server = createSorobanServer(rpcUrl);
  const transaction = TransactionBuilder.fromXDR(signedXdr, networkPassphrase);

  const submission = (await server.sendTransaction(transaction)) as {
    hash?: string;
    status?: string;
    errorResultXdr?: string;
  };

  const txHash = submission.hash ?? hashTransaction(transaction);

  return {
    txHash,
    status: submission.status ?? "UNKNOWN",
    errorResultXdr: submission.errorResultXdr,
  };
}

function parseTrackedStatus(status: unknown): ContractTransactionStatus {
  if (status === "success" || status === "failed" || status === "cancelled") {
    return status;
  }

  if (status === "signed" || status === "submitted") {
    return status;
  }

  if (status === "pending") {
    return "pending";
  }

  return "pending_signature";
}

export async function trackContractTransactionStatus(
  historyId: string
): Promise<TrackedStatus> {
  const response = await fetch(`/api/transactions/${historyId}/status`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Failed to fetch transaction status.");
  }

  const payload = (await response.json()) as {
    status?: string;
    tx_hash?: string | null;
    onchain_status?: "pending" | "not_submitted" | "success" | "failed";
    ledger?: number;
  };

  return {
    status: parseTrackedStatus(payload.status),
    onchainStatus: payload.onchain_status ?? "pending",
    txHash: payload.tx_hash ?? null,
    ledger: payload.ledger,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function waitForTerminalTransactionStatus(
  historyId: string,
  options?: {
    intervalMs?: number;
    timeoutMs?: number;
  }
): Promise<TrackedStatus> {
  const intervalMs = options?.intervalMs ?? 4_000;
  const timeoutMs = options?.timeoutMs ?? 120_000;
  const deadline = Date.now() + timeoutMs;

  let status = await trackContractTransactionStatus(historyId);

  while (
    Date.now() < deadline &&
    (status.onchainStatus === "pending" || status.onchainStatus === "not_submitted")
  ) {
    await sleep(intervalMs);
    status = await trackContractTransactionStatus(historyId);
  }

  return status;
}

type CreateHistoryPayload = {
  listing_id?: string;
  contract_id: string;
  method: string;
  wallet_address: string;
  network: string;
  status: ContractTransactionStatus;
  fee_stroops?: number;
  gas_estimate?: number;
  request_xdr?: string;
  signed_xdr?: string;
  tx_hash?: string;
  error_message?: string;
  metadata?: Record<string, JsonValue>;
};

async function createHistoryEntry(payload: CreateHistoryPayload): Promise<string> {
  const response = await fetch("/api/transactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorPayload?.error ?? "Failed to create transaction history entry.");
  }

  const created = (await response.json()) as { id: string };
  return created.id;
}

async function updateHistoryEntry(id: string, updates: Partial<CreateHistoryPayload>) {
  const response = await fetch("/api/transactions", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, ...updates }),
  });

  if (!response.ok) {
    const errorPayload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(errorPayload?.error ?? "Failed to update transaction history entry.");
  }
}

export async function executeContractTransaction(
  params: ExecuteContractTransactionParams
): Promise<ExecuteContractTransactionResult> {
  const build = await buildContractTransaction(params);

  const historyId = await createHistoryEntry({
    listing_id: params.listingId,
    contract_id: params.contractId,
    method: params.method,
    wallet_address: params.sourcePublicKey,
    network: build.network,
    status: "pending_signature",
    fee_stroops: build.feeStroops,
    gas_estimate: build.gasEstimate?.stroops,
    request_xdr: build.unsignedXdr,
    metadata: {
      ...(params.metadata ?? {}),
      gas_source: build.gasEstimate?.source ?? null,
      created_by: "executeContractTransaction",
    },
  });

  try {
    const signedXdr = await signContractTransaction(build.unsignedXdr, build.networkPassphrase);

    await updateHistoryEntry(historyId, {
      status: "signed",
      signed_xdr: signedXdr,
    });

    const submit = await submitSignedContractTransaction(
      signedXdr,
      build.networkPassphrase,
      build.rpcUrl
    );

    await updateHistoryEntry(historyId, {
      status: "submitted",
      tx_hash: submit.txHash,
      error_message: submit.errorResultXdr,
    });

    return {
      historyId,
      txHash: submit.txHash,
      build,
      submit,
    };
  } catch (error) {
    const isCancelled = error instanceof FreighterSigningCancelledError;
    const message = error instanceof Error ? error.message : "Transaction failed.";

    await updateHistoryEntry(historyId, {
      status: isCancelled ? "cancelled" : "failed",
      error_message: message,
    }).catch(() => null);

    throw error;
  }
}

export async function getNetworkTransactionStatus(
  transactionHash: string,
  network?: string
): Promise<{ status: ContractTransactionStatus; ledger?: number }> {
  const networkConfig = getStellarNetworkConfig(network);
  const horizonServer = new Horizon.Server(networkConfig.horizonUrl);

  try {
    const tx = await horizonServer.transactions().transaction(transactionHash).call();
    return {
      status: tx.successful ? "success" : "failed",
      ledger: tx.ledger,
    };
  } catch {
    return {
      status: "pending",
    };
  }
}
