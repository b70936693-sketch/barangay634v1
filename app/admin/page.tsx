"use client";

import Link from "next/link";
import { ArrowRight, BadgeCheck, Briefcase, Flag, ShieldAlert, Users } from "lucide-react";

import { AdminPanel } from "./_components";
import { useAdminPortal } from "./api-client-react";

const quickLinks = [
  { href: "/admin/dashboard", title: "Dashboard", copy: "Platform overview, recent activity, and key counts.", icon: Briefcase },
  { href: "/admin/verifications", title: "Verifications", copy: "Approve applicant and employer requirements.", icon: BadgeCheck },
  { href: "/admin/applicants", title: "Applicants", copy: "Track hiring progress across community residents.", icon: Users },
  { href: "/admin/reports", title: "Reports", copy: "Review cases, incidents, and moderation tasks.", icon: Flag },
  { href: "/admin/safety-security", title: "Safety & Security", copy: "Respond to active platform alerts.", icon: ShieldAlert },
];

export default function AdminIndexPage() {
  const { data } = useAdminPortal();

  return (
    <div className="space-y-6">
      <AdminPanel
        title="Control Center"
        description="Use the connected backend data below to jump into the queues that need attention right now."
      >
        <div className="flex gap-4 overflow-x-auto pb-2">
          {quickLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="min-w-[18rem] flex-shrink-0 rounded-2xl border border-[#dbe5ef] bg-[#fbfdff] p-5 transition-colors hover:bg-white"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#eef5fb] text-[#2f6fa4]">
                <item.icon className="h-6 w-6" />
              </div>
              <div className="mt-4 text-lg font-semibold text-[#28415d]">{item.title}</div>
              <p className="mt-2 text-sm text-[#73869a]">{item.copy}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#2f6fa4]">
                Open
                <ArrowRight className="h-4 w-4" />
              </div>
            </Link>
          ))}
        </div>
      </AdminPanel>

      <AdminPanel title="Connected Snapshot" description="These values now come from the shared portal backend, not static page arrays.">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-[#dbe5ef] bg-[#fbfdff] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7c8ea1]">Applications</div>
            <div className="mt-2 text-3xl font-bold text-[#203142]">{data?.adminSummary?.totalApplications ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-[#dbe5ef] bg-[#fbfdff] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7c8ea1]">Verified Employers</div>
            <div className="mt-2 text-3xl font-bold text-[#203142]">{data?.adminSummary?.verifiedEmployers ?? 0}</div>
          </div>
          <div className="rounded-2xl border border-[#dbe5ef] bg-[#fbfdff] p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#7c8ea1]">Recent Activity</div>
            <div className="mt-2 text-3xl font-bold text-[#203142]">{data?.recentActivity?.length ?? 0}</div>
          </div>
        </div>
      </AdminPanel>
    </div>
  );
}
