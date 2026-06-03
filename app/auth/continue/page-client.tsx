"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { getSessionSafe, supabase } from "@/lib/supabase";

type AuthState =
  | { kind: "loading" }
  | { kind: "pending"; role: string | null; status: string | null }
  | { kind: "error"; message: string };

export default function AuthContinueClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [state, setState] = useState<AuthState>({ kind: "loading" });

  useEffect(() => {
    const continueAuth = async () => {
      let accessToken: string | undefined;

      try {
        const session = await getSessionSafe();
        accessToken = session?.data?.session?.access_token;
      } catch (error) {
        console.error("Unable to retrieve session during auth continue:", error);
      }

      let response: Response | null = null;

      try {
        response = await fetch("/api/portal/auth", {
          credentials: "include",
          headers: {
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });
      } catch (error) {
        console.error("Unable to validate auth session during continue flow:", error);
        setState({ kind: "error", message: "We could not connect to the portal right now. Please try again." });
        return;
      }

      if (!response || !response.ok) {
        const requestedRole = searchParams.get("role");
        if (!accessToken || response.status === 401 || response.status === 403) {
          router.replace(requestedRole ? `/sign-in?role=${requestedRole}` : "/sign-in");
          return;
        }

        setState({ kind: "error", message: "We could not validate your account session." });
        return;
      }

      const result = await response.json();
      if (!result?.portalUser) {
        const requestedRole = searchParams.get("role");
        router.replace(requestedRole ? `/sign-in?role=${requestedRole}` : "/sign-in");
        return;
      }

      if (result.isApproved) {
        const redirectTarget =
          result.redirectTo ||
          (result.portalUser.role === "admin"
            ? "/admin"
            : result.portalUser.role === "employer"
            ? "/employer"
            : "/applicant");
        router.replace(redirectTarget);
        return;
      }

      setState({
        kind: "pending",
        role: result.portalUser.role ?? null,
        status: result.portalUser.status ?? null,
      });
    };

    void continueAuth();
  }, [router, searchParams]);

  if (state.kind === "pending") {
    const roleLabel = state.role === "employer" ? "employer" : "applicant";

    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#edf3f8_0%,#f7fafc_100%)] px-4 py-10">
        <div className="mx-auto flex min-h-[80vh] max-w-2xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-[#d6e1eb] bg-white p-8 text-center shadow-[0_18px_40px_rgba(37,91,142,0.08)]">
            <h1 className="text-3xl font-bold text-[#224264]">Waiting For Admin Approval</h1>
            <p className="mt-4 text-sm leading-7 text-[#627689]">
              Your {roleLabel} account was created successfully, but you cannot enter the portal yet.
              A barangay admin must review and approve your verification documents first.
            </p>
            <p className="mt-3 text-sm text-[#7d8fa1]">
              Current account status: <span className="font-semibold text-[#224264]">{state.status ?? "pending"}</span>
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => router.replace("/sign-in")}
                className="rounded-2xl border border-[#d6e1eb] px-5 py-3 text-sm font-semibold text-[#35587d] hover:bg-[#f7fbff]"
              >
                Back To Sign In
              </button>
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.replace("/");
                }}
                className="rounded-2xl bg-[#2f6fa4] px-5 py-3 text-sm font-semibold text-white hover:bg-[#244f7b]"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (state.kind === "error") {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#edf3f8_0%,#f7fafc_100%)] px-4 py-10">
        <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-[2rem] border border-[#d6e1eb] bg-white p-8 text-center shadow-[0_18px_40px_rgba(37,91,142,0.08)]">
            <h1 className="text-2xl font-bold text-[#224264]">Account Check Failed</h1>
            <p className="mt-4 text-sm text-[#627689]">{state.message}</p>
          </div>
        </div>
      </div>
    );
  }

  return <div className="min-h-screen bg-[linear-gradient(180deg,#edf3f8_0%,#f7fafc_100%)]" />;
}
