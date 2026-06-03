"use client";

import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { getSessionSafe, supabase } from "@/lib/supabase";

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      try {
        const result = await getSessionSafe();
        const sessionData = result.data?.session ?? null;

        if (!mounted) return;
        setSession(sessionData);
      } catch (error) {
        console.error('Supabase session load failed:', error);
        if (!mounted) return;
        setSession(null);
      } finally {
        if (!mounted) return;
        setIsLoaded(true);
      }
    };

    loadSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, authSession) => {
      if (!mounted) return;
      setSession(authSession ?? null);
      setIsLoaded(true);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return {
    session,
    user: session?.user ?? null,
    isLoaded,
    isSignedIn: Boolean(session),
    signOut: async () => {
      await supabase.auth.signOut();
    },
  };
}
