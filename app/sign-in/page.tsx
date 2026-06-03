"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSessionSafe, supabase } from "@/lib/supabase";

type Role = "applicant" | "employer" | "admin";

function resolveRoleFromRedirect(redirectUrl: string | null): Role | null {
  if (!redirectUrl) return null;

  try {
    const normalizedUrl = redirectUrl.startsWith("http")
      ? new URL(redirectUrl)
      : new URL(redirectUrl, window.location.origin);
    const role = normalizedUrl.searchParams.get("role");
    return role === "applicant" || role === "employer" || role === "admin"
      ? role
      : null;
  } catch {
    return null;
  }
}

export default function SignInPage() {
  const router = useRouter();
  const [role, setRole] = useState<Role>("applicant");
  const [redirectUrl, setRedirectUrl] = useState<string>("/auth/continue?role=applicant");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const searchParams = new URLSearchParams(window.location.search);
    const roleFromParam = searchParams.get("role");
    const redirectUrlParam = searchParams.get("redirect_url");

    const resolvedRole =
      roleFromParam === "applicant" || roleFromParam === "employer" || roleFromParam === "admin"
        ? (roleFromParam as Role)
        : resolveRoleFromRedirect(redirectUrlParam) ?? "applicant";

    const rawRedirect = redirectUrlParam || "/auth/continue";
    const resolvedRedirectUrl =
      !rawRedirect.includes("/auth/continue?role=") && rawRedirect.startsWith("/auth/continue")
        ? `${rawRedirect}${rawRedirect.includes("?") ? "&" : "?"}role=${resolvedRole}`
        : rawRedirect;

    setRole(resolvedRole);
    setRedirectUrl(resolvedRedirectUrl);
  }, []);




  useEffect(() => {
    if (typeof window === "undefined") return;
    window.sessionStorage.removeItem("jobserve_pending_role");
    window.localStorage.removeItem("jobserve_pending_role");
    window.sessionStorage.removeItem("jobserve_pending_email");
    window.localStorage.removeItem("jobserve_pending_email");
  }, []);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const handleForgotPassword = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email) {
      setErrorMessage("Please enter your email address first to reset your password.");
      return;
    }

    setIsResettingPassword(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        setErrorMessage(error.message);
      } else {
        setSuccessMessage("Password reset link has been sent to your email.");
      }
    } catch (err) {
      setErrorMessage("An unexpected error occurred. Please try again.");
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

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

    setIsSubmitting(false);

    if (error) {
      const message = error.message?.toLowerCase() ?? "";
      if (message.includes("confirm") || message.includes("verified") || message.includes("verification")) {
        setErrorMessage(
          "Your email is not verified yet. Please check your inbox or spam folder for the confirmation link before signing in."
        );
      } else {
        setErrorMessage(error.message || "Unable to sign in. Please try again.");
      }
      return;
    }

    if (data?.session) {


      const expectedToken = data.session.access_token;
      const waitForSession = async () => {
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
      };

      const activeSession = (await waitForSession()) ?? data.session;
      let authResponse: Response | null = null;

      try {
        authResponse = await fetch("/api/portal/auth", {
          credentials: "include",
        });
      } catch (error) {
        console.error("Unable to validate sign-in session:", error);
        await supabase.auth.signOut();
        setErrorMessage("We could not validate your session right now. Please try again.");
        return;
      }

      if (!authResponse || !authResponse.ok) {
        await supabase.auth.signOut();
        setErrorMessage(
          "Unable to validate your account session. Please try again or contact support if the problem persists."
        );
        return;
      }

      const authResult = await authResponse.json();
      if (!authResult?.isApproved) {
        await supabase.auth.signOut();
        setErrorMessage("Your account is waiting for admin verification. You can sign in only after the admin approves your documents.");
        return;
      }

      router.push(redirectUrl);
      return;
    }



    setErrorMessage("Sign in successful. Redirecting...");
    await getSessionSafe();
    router.push(redirectUrl);


  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">Sign In</h1>
        <p className="mt-2 text-sm text-slate-500">Use your Barangay 634 account to continue.</p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <label className="block space-y-2">
            <span className="text-sm font-semibold text-slate-700">Email</span>

            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            />
          </label>
          
          <div className="block space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">Password</span>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={isResettingPassword}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition disabled:opacity-50"
              >
                {isResettingPassword ? "Sending link..." : "Forgot password?"}
              </button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-slate-500"
            />
          </div>

          {errorMessage ? (
            <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{errorMessage}</div>
          ) : null}

          {successMessage ? (
            <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{successMessage}</div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>
      </div>
    </div>
  );
}