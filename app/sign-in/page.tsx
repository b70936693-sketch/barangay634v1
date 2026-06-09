"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { requestPasswordReset, resolvePortalSessionRedirect, signInToPortal } from "@/lib/client-portal-sign-in";

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

  useEffect(() => {
    const redirectIfSignedIn = async () => {
      const destination = await resolvePortalSessionRedirect();
      if (destination) {
        router.replace(destination);
      }
    };

    void redirectIfSignedIn();
  }, [router]);

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
    const result = await requestPasswordReset(email);
    setIsResettingPassword(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    setSuccessMessage("Password reset link has been sent to your email.");
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    const result = await signInToPortal(email, password);
    setIsSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error);
      return;
    }

    router.push(result.redirectTo || redirectUrl);
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