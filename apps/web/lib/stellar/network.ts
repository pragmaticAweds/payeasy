import { Networks } from "stellar-sdk";

export type StellarNetworkName = "testnet" | "futurenet" | "mainnet";

export type StellarNetworkConfig = {
  name: StellarNetworkName;
  networkPassphrase: string;
  horizonUrl: string;
  sorobanRpcUrl: string;
  freighterNetwork: "TESTNET" | "FUTURENET" | "PUBLIC";
};

const DEFAULT_CONFIG: Record<StellarNetworkName, Omit<StellarNetworkConfig, "name">> = {
  testnet: {
    networkPassphrase: Networks.TESTNET,
    horizonUrl: "https://horizon-testnet.stellar.org",
    sorobanRpcUrl: "https://soroban-testnet.stellar.org",
    freighterNetwork: "TESTNET",
  },
  futurenet: {
    networkPassphrase: "Test SDF Future Network ; October 2022",
    horizonUrl: "https://horizon-futurenet.stellar.org",
    sorobanRpcUrl: "https://rpc-futurenet.stellar.org",
    freighterNetwork: "FUTURENET",
  },
  mainnet: {
    networkPassphrase: Networks.PUBLIC,
    horizonUrl: "https://horizon.stellar.org",
    sorobanRpcUrl: "https://mainnet.sorobanrpc.com",
    freighterNetwork: "PUBLIC",
  },
};

function normalizeNetworkName(value?: string | null): StellarNetworkName {
  const normalized = value?.trim().toLowerCase();

  if (normalized === "mainnet" || normalized === "public" || normalized === "pubnet") {
    return "mainnet";
  }

  if (normalized === "futurenet") {
    return "futurenet";
  }

  return "testnet";
}

export function getStellarNetworkConfig(requestedNetwork?: string | null): StellarNetworkConfig {
  const networkName = normalizeNetworkName(
    requestedNetwork ?? process.env.NEXT_PUBLIC_STELLAR_NETWORK ?? process.env.STELLAR_NETWORK
  );

  const defaults = DEFAULT_CONFIG[networkName];

  const horizonUrl =
    process.env.STELLAR_HORIZON_URL ??
    process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL ??
    defaults.horizonUrl;

  const sorobanRpcUrl =
    process.env.SOROBAN_RPC_URL ??
    process.env.NEXT_PUBLIC_SOROBAN_RPC_URL ??
    defaults.sorobanRpcUrl;

  const networkPassphrase =
    process.env.STELLAR_NETWORK_PASSPHRASE ??
    process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE ??
    defaults.networkPassphrase;

  return {
    name: networkName,
    networkPassphrase,
    horizonUrl,
    sorobanRpcUrl,
    freighterNetwork: defaults.freighterNetwork,
  };
}
