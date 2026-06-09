"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Heart, LogOut, FileCheck, UserCircle2, Sparkles, BadgeCheck, CalendarClock, Bell } from "lucide-react";
import { getSessionSafe } from "@/lib/supabase";
import { useSupabaseSession } from "@/lib/hooks/useSupabaseSession";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  useGetApplicantProfile,
  useGetCurrentPortalUser,
  useListApplicantApplications,
  useListApplicantNotifications,
} from "@workspace/api-client-react";
import { getApplicantHeadlineText, parseApplicantProfileMeta } from "@/lib/applicant-profile-meta";

const navItems = [
  { href: "/applicant", label: "Discover Jobs", icon: Sparkles },
  { href: "/applicant/applications", label: "My Applications", icon: FileCheck },
  { href: "/applicant/notifications", label: "Notifications", icon: Bell },
  { href: "/applicant/profile", label: "My Profile", icon: UserCircle2 },
];

const titles: Record<string, string> = {
  "/applicant": "Swipe Opportunities",
  "/applicant/applications": "My Applications",
  "/applicant/notifications": "Notifications",
  "/applicant/profile": "Applicant Profile",
};

export default function ApplicantLayout({ children }: { children: React.ReactNode }) {
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
      <ApplicantShell>{children}</ApplicantShell>
    </QueryClientProvider>
  );
}

function ApplicantShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useSupabaseSession();
  const { data: profile } = useGetApplicantProfile();
  const { data: currentUser } = useGetCurrentPortalUser();
  const { data: applications = [] } = useListApplicantApplications();
  const { data: notificationData } = useListApplicantNotifications();

  const displayName = currentUser?.fullName ?? profile?.fullName ?? "Applicant";
  const profilePhotoUrl = useMemo(
    () => parseApplicantProfileMeta(profile?.headline).photoUrl ?? null,
    [profile?.headline],
  );
  const profileHeadline = getApplicantHeadlineText(profile?.headline);
  const pageTitle = titles[pathname] ?? "Applicant Portal";
  const interviewCount = applications.filter((item: any) => item.status === "for_interview").length;
  const unreadNotifications = notificationData?.unreadCount ?? 0;

  useEffect(() => {
    const checkRole = async () => {
      let accessToken: string | undefined;
      try {
        const session = await getSessionSafe();
        accessToken = session?.data?.session?.access_token;
      } catch (error) {
        console.error('Unable to retrieve Supabase session in applicant layout:', error);
        accessToken = undefined;
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
        console.error("Unable to validate applicant portal session:", error);
        return;
      }

      if (!response || !response.ok) return;
      const result = await response.json();
      if (result.role && result.role !== "applicant") {
        router.replace(result.redirectTo || "/");
        return;
      }
      if (result.role === "applicant" && result.status !== "verified") {
        router.replace(result.redirectTo || "/");
      }
    };
    void checkRole();
  }, [router]);

  return (
    <div className="applicant-portal min-h-screen bg-[linear-gradient(180deg,#edf3f8_0%,#f7fafc_100%)] text-[#24364a]">
      <header className="border-b border-[#1d4f7b] bg-[#2f5e8f] text-white shadow-[0_8px_24px_rgba(25,59,91,0.18)]">
        <div className="mx-auto flex max-w-[1440px] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2 text-lg font-bold tracking-tight sm:text-[1.65rem]">
            <span>Barangay</span>
            <span className="text-[#ffd45d]">634</span>
            <span className="text-white/90">- Applicant Portal</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden items-center gap-2.5 sm:flex">
              <div className="h-9 w-9 overflow-hidden rounded-full border-2 border-white/25 bg-white/10 shadow-sm">
                {profilePhotoUrl ? (
                  <img src={profilePhotoUrl} alt={`${displayName} photo`} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-[#255b89] text-sm font-bold text-white">
                    {displayName.charAt(0) || "A"}
                  </div>
                )}
              </div>
              <div className="rounded-full border border-[#f0bf49] bg-[#ffd45d] px-4 py-2 text-xs font-semibold text-[#3f4e5c] shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]">
                {displayName}
              </div>
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
              {profilePhotoUrl ? (
                <img src={profilePhotoUrl} alt={`${displayName} photo`} className="h-full w-full object-cover" />
              ) : (
                <img src="/logo.jpg" alt="Barangay 634 logo" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="text-base font-semibold text-[#27384b]">{displayName}</div>
            <div className="mt-1 text-xs font-medium text-[#7c8ea1]">
              {profileHeadline || (displayName !== "Applicant" ? "Welcome back" : "Community job seeker")}
            </div>
            <div className="mt-3 inline-flex items-center gap-1 rounded-full border border-[#bfe9cb] bg-[#ecfbf0] px-3 py-1 text-[11px] font-semibold text-[#53a467]">
              <BadgeCheck className="h-3.5 w-3.5" />
              Ready for verification
            </div>
          </div>

          <nav className="mt-5 space-y-1.5">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const showBadge = item.href === "/applicant/notifications" && unreadNotifications > 0;

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
                    {showBadge ? (
                      <span className="rounded-full bg-[#ffd45d] px-2 py-0.5 text-[10px] font-bold text-[#3f4e5c]">
                        {unreadNotifications}
                      </span>
                    ) : null}
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
                <h1 className="text-3xl font-semibold tracking-tight text-[#2f6497]">{pageTitle}</h1>
                <p className="mt-1 text-sm text-[#7d8fa1]">Explore local job cards and track your hiring journey.</p>
              </div>
              <div className="text-sm font-medium text-[#8a99ab]">{format(new Date(), "EEEE, MMMM d, yyyy")}</div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
              <ApplicantStat title="Applications Sent" value={applications.length} icon={Heart} />
              <ApplicantStat title="Unread Alerts" value={unreadNotifications} icon={Bell} />
              <ApplicantStat title="For Interview" value={interviewCount} icon={CalendarClock} />
              <ApplicantStat title="Documents Ready" value={profile?.documentsReady?.length ?? 0} icon={FileCheck} />
              <ApplicantStat title="Barangay Ready" value={1} icon={BadgeCheck} />
            </div>

            <div className="mt-4 flex gap-2 overflow-x-auto pb-1 lg:hidden">
              {navItems.map((item) => {
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

function ApplicantStat({
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
