"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  PlusCircle,
  Clock,
  Users,
  CheckCircle,
  Calendar,
  Building,
  Settings,
  LogOut,
  BadgeCheck,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useSupabaseSession } from "@/lib/hooks/useSupabaseSession";

import { Button } from "@/components/ui/button";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { getSessionSafe } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { useGetCurrentPortalUser, useGetDashboardSummary, useGetEmployerProfile } from "@workspace/api-client-react";

const navItems = [
  { href: "/employer", label: "Dashboard", icon: LayoutDashboard },
  { href: "/employer/my-job-posts", label: "My Job Posts", icon: Briefcase, countKey: "activePosts" },
  { href: "/employer/create-post", label: "Create New Post", icon: PlusCircle },
  { href: "/employer/pending-review", label: "Pending Review", icon: Clock, countKey: "pendingReview" },
  { href: "/employer/all-applicants", label: "All Applicants", icon: Users, countKey: "totalApplicants" },
  { href: "/employer/hired", label: "Hired", icon: CheckCircle, countKey: "hired" },
  { href: "/employer/for-interview", label: "For Interview", icon: Calendar, countKey: "forInterview" },
  { href: "/employer/company-profile", label: "Company Profile", icon: Building },
  { href: "/employer/settings", label: "Settings", icon: Settings },
];

const navItemsLookup: Record<string, string> = {
  "/employer": "Employer Dashboard",
  "/employer/my-job-posts": "My Job Posts",
  "/employer/create-post": "Create New Post",
  "/employer/pending-review": "Pending Review",
  "/employer/all-applicants": "All Applicants",
  "/employer/hired": "Hired Applicants",
  "/employer/for-interview": "Scheduled Interviews",
  "/employer/company-profile": "Company Profile",
  "/employer/settings": "Settings",
};

function EmployerLayoutContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useSupabaseSession();
  const { data: profile } = useGetEmployerProfile();
  const { data: currentUser } = useGetCurrentPortalUser();
  const { data: summary } = useGetDashboardSummary();

  const pageTitle = navItemsLookup[pathname] ?? "Employer Portal";

  const navItemsWithCounts = navItems.map((item) => {
    const count = item.countKey
      ? ((summary?.[item.countKey as keyof typeof summary] as number) ?? 0)
      : undefined;

    return {
      ...item,
      count,
    };
  });

  const primaryNav = navItemsWithCounts.slice(0, 3);
  const hiringNav = navItemsWithCounts.slice(3, 7);
  const accountNav = navItemsWithCounts.slice(7);

  const profileName = currentUser?.fullName ?? profile?.contactPerson ?? "Employer";
  const profileCompany = profile?.companyName ?? "Employer Portal";
  const profileVerified = profile?.verified ?? false;
  const { isLoaded, isSignedIn } = useSupabaseSession();

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      router.replace("/");
      return;
    }

    const checkRole = async () => {
      let accessToken: string | undefined;
      try {
        const session = await getSessionSafe();
        accessToken = session?.data?.session?.access_token;
      } catch (error) {
        console.error('Unable to retrieve Supabase session in employer layout:', error);
        accessToken = undefined;
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
        console.error("Unable to validate employer portal session:", error);
        return;
      }

      if (!response || !response.ok) return;
      const result = await response.json();
      if (result.role && result.role !== "employer") {
        router.replace(result.redirectTo || "/");
        return;
      }
      if (result.role === "employer" && result.status !== "verified") {
        router.replace(result.redirectTo || "/");
      }
    };

    void checkRole();
  }, [isLoaded, isSignedIn, router]);


  return (
    <div className="employer-portal min-h-screen bg-[linear-gradient(180deg,#edf3f8_0%,#f7fafc_100%)] text-[#24364a]">
      <header className="border-b border-[#1d4f7b] bg-[#2f5e8f] text-white shadow-[0_8px_24px_rgba(25,59,91,0.18)]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-lg font-bold tracking-tight sm:text-[1.65rem]">
            <span>Barangay</span>
            <span className="text-[#ffd45d]">634</span>
            <span className="text-white/90">- Employer Portal</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full border border-[#f0bf49] bg-[#ffd45d] px-4 py-2 text-xs font-semibold text-[#3f4e5c] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)] sm:flex">
              {profileCompany}
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
          <div className="flex flex-col items-center border-b border-[#e4ecf3] pb-5 text-center">
            <div className="mb-4 h-20 w-20 overflow-hidden rounded-[1.25rem] border-[6px] border-[#edf4fa] bg-[#2f6fa4]">
              <img src="/logo.jpg" alt="Barangay 634 logo" className="h-full w-full object-cover" />
            </div>
            <div className="text-base font-semibold text-[#27384b]">{profileName}</div>
            <div className="mt-1 text-xs font-medium text-[#7c8ea1]">{profileCompany}</div>
            {profileVerified && (
              <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-[#bfe9cb] bg-[#ecfbf0] px-3 py-1 text-[11px] font-semibold text-[#53a467]">
                <BadgeCheck className="h-3.5 w-3.5" />
                Verified Employer
              </div>
            )}
          </div>

          <div className="mt-5 space-y-5">
            <NavSection items={primaryNav} pathname={pathname} />
            <NavSection items={hiringNav} pathname={pathname} />
            <NavSection items={accountNav} pathname={pathname} />
          </div>
        </aside>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="rounded-[28px] border border-[#d6e1eb] bg-white/95 p-4 shadow-[0_18px_40px_rgba(37,91,142,0.08)] sm:p-5">
            <div className="flex flex-col gap-4 border-b border-[#e4ecf3] pb-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <h1 className="text-[1.9rem] font-semibold tracking-tight text-[#2f6497]">{pageTitle}</h1>
                <p className="mt-1 text-sm text-[#7d8fa1]">A cleaner employer workspace styled to match your portal reference.</p>
              </div>
              <div className="text-sm font-medium text-[#8a99ab]">{format(new Date(), "EEEE, MMMM d, yyyy")}</div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <StatsCard title="Active Posts" value={summary?.activePosts ?? 0} icon={Briefcase} />
              <StatsCard title="Total Applicants" value={summary?.totalApplicants ?? 0} icon={Users} />
              <StatsCard title="Pending Review" value={summary?.pendingReview ?? 0} icon={Clock} />
              <StatsCard title="For Interview" value={summary?.forInterview ?? 0} icon={Calendar} />
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navItemsWithCounts.map((item) => {
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex min-w-fit items-center gap-2 rounded-full border px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-[#2f6fa4] bg-[#2f6fa4] text-white"
                        : "border-[#d5e0eb] bg-white text-[#526579]"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                    {item.count !== undefined && (
                      <span className="rounded-full bg-[#e5effa] px-2 py-0.5 text-[11px] font-semibold text-[#1f4f7d]">
                        {item.count}
                      </span>
                    )}
                  </Link>
                );
              })}
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

export default function EmployerLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <EmployerLayoutContent>{children}</EmployerLayoutContent>
    </QueryClientProvider>
  );
}

function NavSection({
  items,
  pathname,
}: {
  items: Array<{
    href: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }>;
  pathname: string;
}) {
  return (
    <div className="border-t border-[#e4ecf3] pt-4 first:border-t-0 first:pt-0">
      <nav className="space-y-1.5">
        {items.map((item) => {
          const isActive = pathname === item.href;

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
    </div>
  );
}

function StatsCard({
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
        <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#dce8f3] bg-[#eef5fb] text-[#2f6fa4] leading-none">
          <Icon className="h-5 w-5 text-current" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.04em] text-[#7c8ea1]">{title}</p>
          <p className="mt-1 text-[1.7rem] font-bold leading-none text-[#203142]">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
