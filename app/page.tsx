"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  requestPasswordReset,
  resolvePortalSessionRedirect,
  signInToPortal,
} from "@/lib/client-portal-sign-in";

type Role = "applicant" | "employer";

export default function HomePage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [roleKeyword, setRoleKeyword] = useState("");

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginSuccess, setLoginSuccess] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  const ROLE_SESSION_KEY = "jobserve_pending_role";

  const normalizeRole = (value: string): Role | null => {
    const keyword = value.trim().toLowerCase();

    if (keyword.includes("applicant")) return "applicant";
    if (keyword.includes("employer")) return "employer";

    return null;
  };

  useEffect(() => {
    const checkExistingSession = async () => {
      try {
        const redirectTo = await resolvePortalSessionRedirect();
        if (redirectTo) {
          router.replace(redirectTo);
          return;
        }
      } catch (error) {
        console.error("Unable to check existing portal session:", error);
      } finally {
        setIsCheckingSession(false);
      }
    };

    void checkExistingSession();
  }, [router]);

  function switchTab(newTab: "login" | "signup") {
    setTab(newTab);
    setLoginError(null);
    setLoginSuccess(null);
  }

  async function handleForgotPassword() {
    setLoginError(null);
    setLoginSuccess(null);

    if (!loginEmail.trim()) {
      setLoginError("Enter your email first, then tap Forgot password.");
      return;
    }

    setIsResettingPassword(true);
    const result = await requestPasswordReset(loginEmail);
    setIsResettingPassword(false);

    if (!result.ok) {
      setLoginError(result.error);
      return;
    }

    setLoginSuccess("Password reset link sent. Check your email inbox or spam folder.");
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError(null);
    setLoginSuccess(null);
    setIsSubmitting(true);

    const result = await signInToPortal(loginEmail, loginPassword);
    setIsSubmitting(false);

    if (!result.ok) {
      setLoginError(result.error);
      return;
    }

    router.push(result.redirectTo);
  }

  function handleSignup(e: React.FormEvent) {
    e.preventDefault();

    const pendingRole = normalizeRole(roleKeyword);

    if (pendingRole) {
      window.sessionStorage.setItem(ROLE_SESSION_KEY, pendingRole);
    } else {
      window.sessionStorage.removeItem(ROLE_SESSION_KEY);
    }

    const redirectPath = pendingRole
      ? `/auth/continue?role=${pendingRole}`
      : "/auth/continue";

    const signUpUrl = pendingRole
      ? `/sign-up?redirect_url=${encodeURIComponent(redirectPath)}&role=${pendingRole}`
      : `/sign-up?redirect_url=${encodeURIComponent(redirectPath)}`;

    window.location.href = signUpUrl;
  }

  if (isCheckingSession) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('/f7406f97-a24a-4705-be21-6aa0c9a088fd.jpg')",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/25 to-indigo-900/30" />
        <div className="relative z-10 rounded-2xl bg-white/90 px-6 py-4 text-sm font-medium text-slate-700 shadow-lg">
          Checking your session...
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen flex items-center overflow-hidden">
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: "url('/f7406f97-a24a-4705-be21-6aa0c9a088fd.jpg')",
        }}
      />

      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/25 to-indigo-900/30" />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center md:items-center gap-10 py-16">
        <div className="flex-1 text-white space-y-6">
          <div>
            <div className="inline-flex rounded-full border border-yellow-300/60 bg-yellow-400/15 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-yellow-200 shadow-sm">
              For Barangay 634 residents only
            </div>

            <h1 className="mt-4 text-4xl md:text-5xl font-bold leading-tight drop-shadow-lg">
              Barangay 634 JobServe
            </h1>

            <p className="mt-3 text-blue-100 text-lg max-w-md">
              Isang komunidad na nagkakaisa para sa trabaho at kabuhayan ng bawat mamamayan.
            </p>
          </div>

          <blockquote className="border-l-4 border-blue-300 pl-4 text-blue-100 italic text-base max-w-sm">
            "Ang bawat residente ng Barangay 634 ay may karapatang magkaroon ng maayos na kabuhayan. Sama-sama tayo sa pag-unlad."
          </blockquote>

          <div className="pt-4 space-y-1 text-blue-200 text-sm">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span>Zone 64, Sampaloc, Manila</span>
            </div>

            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
              </svg>
              <span>(02) 8123-4567</span>
            </div>
          </div>
        </div>

        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex border-b border-gray-200 mb-6">
            <button
              className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
                tab === "login"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              onClick={() => switchTab("login")}
            >
              Log In
            </button>

            <button
              className={`flex-1 pb-3 text-sm font-semibold transition-colors ${
                tab === "signup"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-400 hover:text-gray-600"
              }`}
              onClick={() => switchTab("signup")}
            >
              Sign Up
            </button>
          </div>

          {tab === "login" ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white focus-within:border-[#2f6fa4] focus-within:ring-2 focus-within:ring-[#2f6fa4]/15">
                <input
                  type="email"
                  placeholder="Email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full border-0 bg-transparent px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                  required
                />
                <div className="h-px bg-slate-200" />
                <input
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full border-0 bg-transparent px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
                  required
                />
              </div>

              <div className="flex justify-end px-1">
                <button
                  type="button"
                  onClick={() => void handleForgotPassword()}
                  disabled={isResettingPassword}
                  className="text-xs font-medium text-[#2f6fa4] hover:text-[#244f7b] disabled:opacity-50"
                >
                  {isResettingPassword ? "Sending link..." : "Forgot password?"}
                </button>
              </div>

              {loginError ? (
                <p className="px-1 text-sm text-red-600">{loginError}</p>
              ) : null}

              {loginSuccess ? (
                <p className="px-1 text-sm text-emerald-700">{loginSuccess}</p>
              ) : null}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-2xl bg-[#2f6fa4] py-3 text-sm font-semibold text-white transition hover:bg-[#244f7b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? "Signing in..." : "Log In"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-3">
              <input
                type="text"
                placeholder="Applicant or employer"
                value={roleKeyword}
                onChange={(e) => setRoleKeyword(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#2f6fa4] focus:outline-none focus:ring-2 focus:ring-[#2f6fa4]/15"
              />

              <button
                type="submit"
                className="w-full rounded-2xl bg-[#2f6fa4] py-3 text-sm font-semibold text-white transition hover:bg-[#244f7b]"
              >
                Create Account
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
