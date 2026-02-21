import { z } from "zod";

const serverSchema = z.object({
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),
  DATABASE_URL: z.string().optional(),
  JWT_SECRET: z.string().optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  STELLAR_HORIZON_URL: z.string().url("Stellar Horizon URL must be valid").optional(),
  SOROBAN_RPC_URL: z.string().url("Soroban RPC URL must be valid").optional(),
  STELLAR_NETWORK_PASSPHRASE: z.string().optional(),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Supabase URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().optional(),
  NEXT_PUBLIC_STELLAR_NETWORK: z.string().default("testnet"),
  NEXT_PUBLIC_FREIGHTER_NETWORK: z.string().default("testnet"),
  NEXT_PUBLIC_STELLAR_HORIZON_URL: z
    .string()
    .url("Public Stellar Horizon URL must be valid")
    .optional(),
  NEXT_PUBLIC_SOROBAN_RPC_URL: z
    .string()
    .url("Public Soroban RPC URL must be valid")
    .optional(),
  NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE: z.string().optional(),
});

const envSchema = serverSchema.merge(clientSchema);

const isServer = typeof window === "undefined";

const getEnvVars = () => {
  if (isServer) {
    return {
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      NODE_ENV: process.env.NODE_ENV,
      STELLAR_HORIZON_URL: process.env.STELLAR_HORIZON_URL,
      SOROBAN_RPC_URL: process.env.SOROBAN_RPC_URL,
      STELLAR_NETWORK_PASSPHRASE: process.env.STELLAR_NETWORK_PASSPHRASE,
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      NEXT_PUBLIC_STELLAR_NETWORK: process.env.NEXT_PUBLIC_STELLAR_NETWORK,
      NEXT_PUBLIC_FREIGHTER_NETWORK: process.env.NEXT_PUBLIC_FREIGHTER_NETWORK,
      NEXT_PUBLIC_STELLAR_HORIZON_URL: process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL,
      NEXT_PUBLIC_SOROBAN_RPC_URL: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL,
      NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE: process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE,
    };
  }

  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_STELLAR_NETWORK: process.env.NEXT_PUBLIC_STELLAR_NETWORK,
    NEXT_PUBLIC_FREIGHTER_NETWORK: process.env.NEXT_PUBLIC_FREIGHTER_NETWORK,
    NEXT_PUBLIC_STELLAR_HORIZON_URL: process.env.NEXT_PUBLIC_STELLAR_HORIZON_URL,
    NEXT_PUBLIC_SOROBAN_RPC_URL: process.env.NEXT_PUBLIC_SOROBAN_RPC_URL,
    NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE: process.env.NEXT_PUBLIC_STELLAR_NETWORK_PASSPHRASE,
  };
};

const parsedEnv = isServer
  ? envSchema.safeParse(getEnvVars())
  : clientSchema.safeParse(getEnvVars());

if (!parsedEnv.success) {
  console.warn("⚠️  Missing environment variables:", parsedEnv.error.flatten().fieldErrors);
  console.warn("⚠️  Running with defaults — Supabase features will not work.");
}

const fallback = {
  SUPABASE_SERVICE_ROLE_KEY: "",
  DATABASE_URL: "",
  NODE_ENV: "development" as const,
  NEXT_PUBLIC_SUPABASE_URL: "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: "",
  NEXT_PUBLIC_STELLAR_NETWORK: "testnet",
  NEXT_PUBLIC_FREIGHTER_NETWORK: "testnet",
};

export const env = parsedEnv.success
  ? isServer
    ? (parsedEnv.data as z.infer<typeof envSchema>)
    : (parsedEnv.data as z.infer<typeof clientSchema> & Partial<z.infer<typeof serverSchema>>)
  : fallback;
