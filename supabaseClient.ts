import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const publishableKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

if (!supabaseUrl || !publishableKey) {
  throw new Error(
    "Missing Supabase credentials. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY).",
  );
}

const globalForSupabase = globalThis as unknown as {
  supabase?: SupabaseClient;
};

const supabase =
  globalForSupabase.supabase ?? createClient(supabaseUrl, publishableKey);

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabase = supabase;
}

export default supabase;
