import { createBrowserClient } from "@supabase/ssr";

import { getSupabasePublishableKey, getSupabaseUrl } from "@/lib/supabase-config";

export const supabaseClient = createBrowserClient(
  getSupabaseUrl(),
  getSupabasePublishableKey(),
);

export const supabase = supabaseClient;

export async function getSessionSafe() {
  try {
    return await supabase.auth.getSession();
  } catch (error: unknown) {
    console.warn("Supabase invalid session detected. Clearing auth state.", error);

    try {
      await supabase.auth.signOut();
    } catch (signOutError) {
      console.error("Supabase signOut failed during session recovery:", signOutError);
    }

    return {
      data: { session: null },
      error: error instanceof Error ? error : new Error(String(error)),
    };
  }
}

export async function getAccessToken(): Promise<string | null> {
  const result = await getSessionSafe();
  return result.data?.session?.access_token ?? null;
}
