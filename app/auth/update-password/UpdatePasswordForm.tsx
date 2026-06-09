"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getSessionSafe, supabase } from "@/lib/supabase";

function getRecoveryTokensFromHash() {
  if (typeof window === "undefined") return null;

  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return null;

  const params = new URLSearchParams(hash);
  const accessToken = params.get("access_token");
  const refreshToken = params.get("refresh_token");
  const type = params.get("type");

  if (!accessToken || type !== "recovery") {
    return null;
  }

  return { accessToken, refreshToken };
}

export default function UpdatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initializeRecoverySession = async () => {
      setIsInitializing(true);
      setErrorMessage(null);

      try {
        const code = searchParams.get("code");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            setErrorMessage("This password reset link is invalid or expired. Request a new one from Log In.");
            return;
          }
          setIsReady(true);
          return;
        }

        const hashTokens = getRecoveryTokensFromHash();
        if (hashTokens) {
          const { error } = await supabase.auth.setSession({
            access_token: hashTokens.accessToken,
            refresh_token: hashTokens.refreshToken ?? "",
          });
          if (error) {
            setErrorMessage("This password reset link is invalid or expired. Request a new one from Log In.");
            return;
          }
          setIsReady(true);
          return;
        }

        const sessionResult = await getSessionSafe();
        if (sessionResult.data?.session) {
          setIsReady(true);
          return;
        }

        setErrorMessage("This password reset link is invalid or expired. Request a new one from Log In.");
      } catch (error) {
        console.error("Unable to initialize password recovery session:", error);
        setErrorMessage("Unable to verify your reset link. Please request a new one.");
      } finally {
        setIsInitializing(false);
      }
    };

    void initializeRecoverySession();
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!isReady) {
      setErrorMessage("This password reset link is invalid or expired. Request a new one from Log In.");
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });

      if (error) {
        setErrorMessage(error.message || "Unable to update password.");
        return;
      }

      await supabase.auth.signOut();
      setSuccessMessage("Your password has been updated. Redirecting to log in...");
      window.setTimeout(() => {
        router.push("/");
      }, 1500);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMessage(msg || "Unable to update password.");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <h1 className="text-2xl font-bold text-slate-900">Update Password</h1>
        <p className="mt-2 text-sm text-slate-500">Choose a new password to complete your reset.</p>

        {isInitializing ? (
          <p className="mt-8 text-sm text-slate-500">Verifying your reset link...</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-3">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white focus-within:border-[#2f6fa4] focus-within:ring-2 focus-within:ring-[#2f6fa4]/15">
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                disabled={!isReady || isUpdating}
                className="w-full border-0 bg-transparent px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:opacity-60"
              />
              <div className="h-px bg-slate-200" />
              <input
                type="password"
                placeholder="Confirm password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                disabled={!isReady || isUpdating}
                className="w-full border-0 bg-transparent px-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0 disabled:opacity-60"
              />
            </div>

            {errorMessage ? (
              <p className="px-1 text-sm text-red-600">{errorMessage}</p>
            ) : null}

            {successMessage ? (
              <p className="px-1 text-sm text-emerald-700">{successMessage}</p>
            ) : null}

            <button
              type="submit"
              disabled={isUpdating || !isReady}
              className="w-full rounded-2xl bg-[#2f6fa4] py-3 text-sm font-semibold text-white transition hover:bg-[#244f7b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdating ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
