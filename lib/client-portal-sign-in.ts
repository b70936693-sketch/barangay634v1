"use client";

import { getSessionSafe, supabase } from "@/lib/supabase";

export type PortalSignInResult =
  | { ok: true; redirectTo: string }
  | { ok: false; error: string };

export type PasswordResetResult = { ok: true } | { ok: false; error: string };

export function getPasswordResetRedirectUrl() {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/update-password`;
  }
  return "/auth/update-password";
}

export async function requestPasswordReset(email: string): Promise<PasswordResetResult> {
  const normalizedEmail = email.trim();

  if (!normalizedEmail) {
    return { ok: false, error: "Enter your email first to reset your password." };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, {
    redirectTo: getPasswordResetRedirectUrl(),
  });

  if (error) {
    return { ok: false, error: error.message || "Unable to send reset link. Please try again." };
  }

  return { ok: true };
}

async function waitForSession(expectedToken: string) {
  const start = Date.now();
  while (Date.now() - start < 5000) {
    const sessionResult = await getSessionSafe();
    const session = sessionResult.data?.session;
    if (session?.access_token === expectedToken) {
      return session;
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  return null;
}

export async function resolvePortalSessionRedirect(accessToken?: string): Promise<string | null> {
  if (!accessToken) {
    const session = await getSessionSafe();
    accessToken = session?.data?.session?.access_token;
  }

  if (!accessToken) {
    return null;
  }

  try {
    const response = await fetch("/api/portal/auth", {
      credentials: "include",
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    if (!result?.portalUser) {
      return null;
    }

    if (result.isApproved) {
      return (
        result.redirectTo ||
        (result.portalUser.role === "admin"
          ? "/admin"
          : result.portalUser.role === "employer"
            ? "/employer"
            : "/applicant")
      );
    }

    const role = result.portalUser.role;
    if (role === "employer" || role === "applicant" || role === "admin") {
      return `/auth/continue?role=${role}`;
    }

    return "/auth/continue";
  } catch {
    return null;
  }
}

export async function signInToPortal(email: string, password: string): Promise<PortalSignInResult> {
  if (typeof window !== "undefined") {
    window.sessionStorage.removeItem("jobserve_pending_role");
    window.localStorage.removeItem("jobserve_pending_role");
    window.sessionStorage.setItem("jobserve_pending_email", email);
    window.localStorage.setItem("jobserve_pending_email", email);
  }

  try {
    const currentSession = await getSessionSafe();
    if (currentSession.data?.session?.user?.email?.toLowerCase() !== email.toLowerCase()) {
      await supabase.auth.signOut();
    }
  } catch (error) {
    console.warn("Unable to clear a stale session before sign in:", error);
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    const message = error.message?.toLowerCase() ?? "";
    if (message.includes("confirm") || message.includes("verified") || message.includes("verification")) {
      return {
        ok: false,
        error:
          "Your email is not verified yet. Please check your inbox or spam folder for the confirmation link before signing in.",
      };
    }
    return { ok: false, error: error.message || "Unable to sign in. Please try again." };
  }

  if (!data?.session) {
    return { ok: false, error: "Sign in failed. Please try again." };
  }

  const activeSession = (await waitForSession(data.session.access_token)) ?? data.session;
  const bearerToken = activeSession.access_token;

  let authResponse: Response | null = null;

  try {
    authResponse = await fetch("/api/portal/auth", {
      credentials: "include",
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
  } catch (error) {
    console.error("Unable to validate sign-in session:", error);
    await supabase.auth.signOut();
    return { ok: false, error: "We could not validate your session right now. Please try again." };
  }

  if (!authResponse?.ok) {
    await supabase.auth.signOut();
    return {
      ok: false,
      error: "Unable to validate your account session. Please try again or contact support if the problem persists.",
    };
  }

  const authResult = await authResponse.json();

  if (!authResult?.portalUser) {
    await supabase.auth.signOut();
    return { ok: false, error: "We could not find your portal account. Please contact support." };
  }

  if (authResult.isApproved) {
    const redirectTo =
      authResult.redirectTo ||
      (authResult.portalUser.role === "admin"
        ? "/admin"
        : authResult.portalUser.role === "employer"
          ? "/employer"
          : "/applicant");
    return { ok: true, redirectTo };
  }

  const role = authResult.portalUser.role;
  const redirectTo =
    role === "employer" || role === "applicant" || role === "admin"
      ? `/auth/continue?role=${role}`
      : "/auth/continue";

  return { ok: true, redirectTo };
}
