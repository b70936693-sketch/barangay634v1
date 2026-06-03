import dotenv from "dotenv";

if (typeof window === "undefined" && !process.env.NEXT_PUBLIC_SUPABASE_URL) {
  dotenv.config();
}

function requireEnv(name: string, value: string | undefined) {
  if (!value) {
    throw new Error(`Missing required Supabase environment variable: ${name}`);
  }

  return value;
}

function getEnvValue(...names: Array<string | undefined>) {
  return names.find((value) => Boolean(value && value.trim()));
}

export function getSupabaseUrl() {
  return requireEnv(
    "SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL",
    getEnvValue(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_URL),
  );
}

export function getSupabasePublishableKey() {
  return requireEnv(
    "SUPABASE_ANON_KEY, NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY, or NEXT_PUBLIC_SUPABASE_ANON_KEY",
    getEnvValue(
      process.env.SUPABASE_ANON_KEY,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  );
}

export function getSupabaseServiceRoleKey() {
  return requireEnv(
    "SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY",
    getEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY),
  );
}

export function isSupabaseBrowserConfigured() {
  return Boolean(
    getEnvValue(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      getEnvValue(
        process.env.SUPABASE_ANON_KEY,
        process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ),
  );
}

export function isSupabaseServerConfigured() {
  return Boolean(
    getEnvValue(process.env.SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      getEnvValue(process.env.SUPABASE_SERVICE_ROLE_KEY, process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY),
  );
}
