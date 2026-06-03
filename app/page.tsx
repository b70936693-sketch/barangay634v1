"use client";

import { useState } from "react";

type Role = "admin" | "applicant" | "employer";

export default function HomePage() {
  const [tab, setTab] = useState<"login" | "signup">("login");
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [roleKeyword, setRoleKeyword] = useState("");
  const ROLE_SESSION_KEY = "jobserve_pending_role";

  const normalizeRole = (value: string): Role | null => {
    const keyword = value.trim().toLowerCase();
    if (keyword.includes("admin")) return "admin";
    if (keyword.includes("applicant")) return "applicant";
    if (keyword.includes("employer")) return "employer";
    return null;
  };

  const getPendingRole = () => {
    return selectedRole ?? normalizeRole(roleKeyword);
  };

  function setRole(role: Role) {
    setSelectedRole(role);
    setRoleKeyword(role);
  }

  function switchTab(newTab: "login" | "signup") {
    setTab(newTab);
    if (newTab === "signup" && selectedRole === "admin") {
      setSelectedRole(null);
      setRoleKeyword("");
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const pendingRole = getPendingRole();

    if (pendingRole) {
      window.sessionStorage.setItem(ROLE_SESSION_KEY, pendingRole);
    } else {
      window.sessionStorage.removeItem(ROLE_SESSION_KEY);
    }

    const redirectPath = pendingRole ? `/auth/continue?role=${pendingRole}` : "/auth/continue";
    const signInUrl = pendingRole
      ? `/sign-in?redirect_url=${encodeURIComponent(redirectPath)}&role=${pendingRole}`
      : `/sign-in?redirect_url=${encodeURIComponent(redirectPath)}`;
    window.location.href = signInUrl;
  }

  function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    const pendingRole = getPendingRole();

    if (pendingRole) {
      window.sessionStorage.setItem(ROLE_SESSION_KEY, pendingRole);
    } else {
      window.sessionStorage.removeItem(ROLE_SESSION_KEY);
    }

    const redirectPath = pendingRole ? `/auth/continue?role=${pendingRole}` : "/auth/continue";
    const signUpUrl = pendingRole
      ? `/sign-up?redirect_url=${encodeURIComponent(redirectPath)}&role=${pendingRole}`
      : `/sign-up?redirect_url=${encodeURIComponent(redirectPath)}`;
    window.location.href = signUpUrl;
  }

  // `visibleRoles` kept for UI logic parity with original version.
  const visibleRoles: Role[] = tab === "login"
    ? ["applicant", "employer", "admin"]
    : ["applicant", "employer"];

  return (
    <div className="relative min-h-screen flex items-center overflow-hidden">
      {/* Background image */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: "url('/f7406f97-a24a-4705-be21-6aa0c9a088fd.jpg')" }}
      />
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/25 to-indigo-900/30" />

      <div className="relative z-10 w-full max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center md:items-center gap-10 py-16">
        {/* Left: branding */}
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
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span>Zone 64, Sampaloc, Manila</span>
            </div>
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              <span>(02) 8123-4567</span>
            </div>
          </div>
        </div>

        {/* Right: login/signup form */}
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl p-8">
          {/* Tabs */}
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
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role</label>
                <div className="grid grid-cols-3 gap-3">
                  {(["applicant", "employer", "admin"] as Role[]).map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={
                        selectedRole === r
                          ? "w-full rounded-lg bg-blue-700 text-white px-3 py-2 text-sm font-semibold"
                          : "w-full rounded-lg border border-gray-300 bg-white text-gray-700 px-3 py-2 text-sm font-semibold hover:bg-gray-50"
                      }
                    >
                      {r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role Keyword</label>
                <input
                  type="text"
                  placeholder="e.g. applicant"
                  value={roleKeyword}
                  onChange={(e) => {
                    setSelectedRole(null);
                    setRoleKeyword(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mt-2"
              >
                Login to Dashboard
              </button>
            </form>
          ) : (
            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Role Keyword (applicant/employer)</label>
                <input
                  type="text"
                  placeholder="e.g. applicant"
                  value={roleKeyword}
                  onChange={(e) => {
                    setSelectedRole(null);
                    setRoleKeyword(e.target.value);
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors mt-2"
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

