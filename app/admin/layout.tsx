"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getSessionSafe } from "@/lib/supabase";
import { useSupabaseSession } from "@/lib/hooks/useSupabaseSession";
import { UserNameDisplay } from "@/app/components/UserNameDisplay";
import {
  ShieldCheck,
  LayoutDashboard,
  BadgeCheck,
  Building2,
  Users,
  ShieldAlert,
  Flag,
  ClipboardList,
  Briefcase,
  Globe,
  LogOut,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAdminPortal } from "./api-client-react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/verifications", label: "Verifications", icon: BadgeCheck },
  { href: "/admin/employers", label: "Employers", icon: Building2 },
  { href: "/admin/applicants", label: "Applicants", icon: Users },
  { href: "/admin/job-posts", label: "Job Posts", icon: Briefcase },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/safety-security", label: "Safety & Security", icon: ShieldAlert },
  { href: "/admin/audit-logs", label: "Audit Logs", icon: ClipboardList },
  { href: "/admin/services", label: "Services", icon: Globe },
];

const pageTitles: Record<string, string> = {
  "/admin": "Admin Overview",
  "/admin/dashboard": "Admin Dashboard",
  "/admin/verifications": "Verification Center",
  "/admin/employers": "Employer Management",
  "/admin/applicants": "Applicant Management",
  "/admin/job-posts": "Job Post Oversight",
  "/admin/reports": "Reports & Escalations",
  "/admin/safety-security": "Safety & Security",
  "/admin/audit-logs": "Audit Logs",
  "/admin/services": "Services",
  "/admin/all-users": "All Users",
  "/admin/all-listings": "All Listings",
  "/admin/verify-accounts": "Verify Accounts",
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000,
            retry: 1,
          },
        },
      })
  );
  
  return (
    <QueryClientProvider client={queryClient}>
      <AdminShell>{children}</AdminShell>
    </QueryClientProvider>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut, isLoaded, isSignedIn: sessionSignedIn } = useSupabaseSession();
  const { data } = useAdminPortal();

  const summary = data?.adminSummary;

  useEffect(() => {
    const checkRole = async () => {
      if (!sessionSignedIn) return;
      let accessToken: string | undefined;
      try {
        const session = await getSessionSafe();
        accessToken = session?.data?.session?.access_token;
      } catch (error) {
        console.error('Unable to retrieve Supabase session in admin layout:', error);
      }

      let response: Response | null = null;

      try {
        response = await fetch("/api/portal/auth", {
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });
      } catch (error) {
        console.error("Unable to validate admin portal session:", error);
        return;
      }

      if (!response || !response.ok) return;
      const result = await response.json();
      if (result.role && result.role !== "admin") {
        router.replace(result.redirectTo || "/");
        return;
      }
    };

    void checkRole();
  }, [router, sessionSignedIn]);

  // Disabled redirect - keeps admin logged





// Temporarily disabled admin role check during migration
  // if (data?.currentUser && data.currentUser.role !== "admin") {
  //   return null;
  // }


  return (
    <div className="applicant-portal min-h-screen bg-[linear-gradient(180deg,#edf3f8_0%,#f7fafc_100%)] text-[#24364a]">
      <header className="border-b border-[#1d4f7b] bg-[#2f5e8f] text-white shadow-[0_8px_24px_rgba(25,59,91,0.18)]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-lg font-bold tracking-tight sm:text-[1.65rem]">
            <ShieldCheck className="h-5 w-5 text-[#ffd45d]" />
            <span>Barangay</span>
            <span className="text-[#ffd45d]">634</span>
            <span className="text-white/90">- Admin Portal</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-[#f0bf49] bg-[#ffd45d] px-4 py-2 text-xs font-semibold text-[#3f4e5c] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] sm:flex">
              Governance and hiring oversight
            </div>
            <Button
              variant="destructive"
              size="sm"
              className="gap-2 rounded-full px-4"
              onClick={async () => {
                await signOut();
                router.push("/");
              }}
            >
              <LogOut className="h-4 w-4" />
              <span>Logout</span>
            </Button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1440px] gap-4 px-3 py-4 sm:px-4 lg:grid-cols-[260px_minmax(0,1fr)] lg:px-5">
        <aside className="hidden rounded-[28px] border border-[#d6e1eb] bg-white/95 p-5 shadow-[0_18px_40px_rgba(37,91,142,0.08)] lg:flex lg:flex-col">
          <div className="border-b border-[#e4ecf3] pb-5">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 overflow-hidden rounded-2xl border-[6px] border-[#edf4fa] bg-[#2f6fa4]">
                <img src="/logo.jpg" alt="Barangay 634 logo" className="h-full w-full object-cover" />
              </div>
              <div>
                <UserNameDisplay />
                <div className="mt-1 text-xs font-medium text-[#7c8ea1]">Admin access</div>
              </div>
            </div>
          </div>

          <nav className="mt-5 space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href || (pathname === "/admin" && item.href === "/admin/dashboard");

              return (
                <Link key={item.href} href={item.href} className="block">
                  <div
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? "bg-[#2f6fa4] text-white shadow-[0_10px_20px_rgba(47,111,164,0.18)]"
                        : "text-[#54677a] hover:bg-[#f3f7fb]"
                    }`}
                  >
                    <item.icon className={`h-4 w-4 ${isActive ? "text-white" : "text-[#5f7488]"}`} />
                    <span className="flex-1">{item.label}</span>
                  </div>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="rounded-[28px] border border-[#d6e1eb] bg-white/95 p-4 shadow-[0_18px_40px_rgba(37,91,142,0.08)] sm:p-5">
            <div className="flex flex-col gap-4 border-b border-[#e4ecf3] pb-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-[1.9rem] font-semibold tracking-tight text-[#2f6497]">
                  {pageTitles[pathname] ?? "Admin Portal"}
                </h1>
                <p className="mt-1 text-sm text-[#7d8fa1]">Monitor employer activity, applicant progress, verifications, and platform safety from one place.</p>
              </div>
              <div className="text-sm font-medium text-[#8a99ab]">{format(new Date(), "EEEE, MMMM d, yyyy")}</div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <AdminStat title="Pending Verifications" value={summary?.pendingVerifications ?? 0} icon={BadgeCheck} />
              <AdminStat title="Active Jobs" value={summary?.activeJobs ?? 0} icon={Briefcase} />
              <AdminStat title="Security Alerts" value={summary?.securityAlerts ?? 0} icon={ShieldAlert} />
              <AdminStat title="Applications" value={summary?.totalApplications ?? 0} icon={Users} />
            </div>
          </div>

          <main className="rounded-[28px] border border-[#d6e1eb] bg-white/95 p-4 shadow-[0_18px_40px_rgba(37,91,142,0.08)] sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function AdminStat({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Card className="rounded-2xl border border-[#d7e1eb] bg-[#fbfdff] shadow-none">
      <CardContent className="flex items-center gap-3 p-4">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#dce8f3] bg-[#eef5fb] text-[#2f6fa4]">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[#7c8ea1]">{title}</p>
          <p className="mt-1 text-[1.7rem] font-bold leading-none text-[#203142]">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
