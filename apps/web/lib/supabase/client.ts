import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createSupabaseBrowserClient> | null = null;

export function createBrowserClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn("Missing Supabase environment variables. Using empty strings for build purposes.");
  }

  return createSupabaseBrowserClient(supabaseUrl || "http://localhost:54321", supabaseKey || "dummy_key");
}

// Alias for backward compatibility
export const createClient = createBrowserClient;

export function getSupabaseClient() {
  if (!browserClient) {
    browserClient = createBrowserClient();
  }
  return browserClient;
}

export function resetClientInstance() {
  browserClient = null;
}
