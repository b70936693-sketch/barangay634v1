"use client";

import { useEffect, useMemo, useState, type ComponentType } from "react";
import Link from "next/link";
import { format, formatDistanceToNow } from "date-fns";
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Clock3,
  FileText,
  Flag,
  ShieldAlert,
  UserCheck,
  Users,
  XCircle,
} from "lucide-react";

import { EmptyState, ListPagination, StatusBadge } from "../_components";
import { useAdminPortal } from "../api-client-react";
import type { AuditLogRecord, VerificationRecord } from "@/lib/backend/types";

type ActivityMeta = {
  icon: ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  lineColor: string;
};

function getActivityMeta(action: string): ActivityMeta {
  const lower = action.toLowerCase();

  if (lower.includes("reject") || lower.includes("suspend") || lower.includes("closed")) {
    return {
      icon: XCircle,
      iconBg: "bg-red-50",
      iconColor: "text-red-600",
      lineColor: "bg-red-200",
    };
  }
  if (lower.includes("verif") || lower.includes("approv") || lower.includes("invite")) {
    return {
      icon: BadgeCheck,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
      lineColor: "bg-emerald-200",
    };
  }
  if (lower.includes("job") || lower.includes("post") || lower.includes("listing")) {
    return {
      icon: Briefcase,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
      lineColor: "bg-blue-200",
    };
  }
  if (lower.includes("report") || lower.includes("alert") || lower.includes("security")) {
    return {
      icon: ShieldAlert,
      iconBg: "bg-amber-50",
      iconColor: "text-amber-600",
      lineColor: "bg-amber-200",
    };
  }
  if (lower.includes("applicant") || lower.includes("application") || lower.includes("hired")) {
    return {
      icon: Users,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
      lineColor: "bg-violet-200",
    };
  }
  if (lower.includes("employer")) {
    return {
      icon: Building2,
      iconBg: "bg-cyan-50",
      iconColor: "text-cyan-600",
      lineColor: "bg-cyan-200",
    };
  }

  return {
    icon: Activity,
    iconBg: "bg-slate-50",
    iconColor: "text-slate-600",
    lineColor: "bg-slate-200",
  };
}

function ActivityTimelineItem({
  log,
  isLast,
}: {
  log: AuditLogRecord;
  isLast: boolean;
}) {
  const meta = getActivityMeta(log.action);
  const Icon = meta.icon;
  const createdAt = new Date(log.createdAt);

  return (
    <div className="relative flex gap-4 pb-6 last:pb-0">
      {!isLast ? (
        <span
          className={`absolute left-[1.15rem] top-10 h-[calc(100%-1.5rem)] w-px ${meta.lineColor}`}
          aria-hidden
        />
      ) : null}
      <div
        className={`relative z-10 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white shadow-sm ${meta.iconBg}`}
      >
        <Icon className={`h-4 w-4 ${meta.iconColor}`} />
      </div>
      <div className="min-w-0 flex-1 pt-0.5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <p className="text-sm font-semibold text-[#203142]">
            <span className="text-[#2f6fa4]">{log.actor}</span>{" "}
            <span className="font-medium text-[#506274]">{log.action.toLowerCase()}</span>
          </p>
          <time
            dateTime={log.createdAt}
            className="shrink-0 text-xs font-medium text-[#7b8ca0]"
            title={format(createdAt, "PPpp")}
          >
            {formatDistanceToNow(createdAt, { addSuffix: true })}
          </time>
        </div>
        <p className="mt-1 text-sm text-[#506274]">{log.target}</p>
      </div>
    </div>
  );
}

function VerificationQueueItem({ item }: { item: VerificationRecord }) {
  const initials = item.subjectName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  const isEmployer = item.type === "Employer Verification";

  return (
    <Link
      href={isEmployer ? "/admin/employers" : "/admin/verifications"}
      className="group flex items-center gap-4 rounded-2xl border border-[#e5edf5] bg-[#f8fbff] p-4 transition hover:border-[#b9d0e8] hover:bg-white hover:shadow-sm"
    >
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${
          isEmployer ? "bg-cyan-100 text-cyan-700" : "bg-violet-100 text-violet-700"
        }`}
      >
        {initials || "?"}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-[#203142]">{item.subjectName}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-[#7b8ca0]">
          <span>{item.type}</span>
          {item.submittedAt ? (
            <>
              <span>•</span>
              <span className="inline-flex items-center gap-1">
                <Clock3 className="h-3 w-3" />
                {formatDistanceToNow(new Date(item.submittedAt), { addSuffix: true })}
              </span>
            </>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusBadge value={item.status} />
        <ArrowRight className="h-4 w-4 text-[#b9c9d9] transition group-hover:text-[#2f6fa4]" />
      </div>
    </Link>
  );
}

function PulseCard({
  label,
  value,
  href,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  href: string;
  icon: ComponentType<{ className?: string }>;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className="group relative overflow-hidden rounded-2xl border border-[#e5edf5] bg-white p-4 transition hover:border-[#b9d0e8] hover:shadow-md"
    >
      <div className={`absolute -right-3 -top-3 h-16 w-16 rounded-full ${accent} opacity-30 blur-2xl`} />
      <div className="relative flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.06em] text-[#7b8ca0]">{label}</p>
          <p className="mt-1 text-2xl font-bold text-[#203142]">{value}</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f4f8fc] text-[#2f6fa4] transition group-hover:bg-[#eef5fb]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <div className="relative mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#2f6fa4]">
        View
        <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
      </div>
    </Link>
  );
}

const ACTIVITY_PAGE_SIZE = 5;

export default function AdminDashboardPage() {
  const { data, isLoading } = useAdminPortal();
  const [activityPage, setActivityPage] = useState(1);

  const summary = data?.adminSummary;
  const allAuditLogs = useMemo(() => {
    const logs = ((data?.auditLogs as AuditLogRecord[] | undefined) ?? []);
    return [...logs].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [data?.auditLogs]);

  const activityTotalPages = Math.max(1, Math.ceil(allAuditLogs.length / ACTIVITY_PAGE_SIZE));
  const auditLogs = allAuditLogs.slice(
    (activityPage - 1) * ACTIVITY_PAGE_SIZE,
    activityPage * ACTIVITY_PAGE_SIZE
  );

  useEffect(() => {
    setActivityPage((page) => Math.min(page, activityTotalPages));
  }, [activityTotalPages]);
  const pendingVerifications = ((data?.verifications as VerificationRecord[] | undefined) ?? [])
    .filter((item) => item.status === "pending")
    .slice(0, 5);
  const openReports = ((data?.reports as Array<{ status: string }> | undefined) ?? []).filter(
    (item) => item.status !== "resolved"
  ).length;
  const activeAlerts = summary?.securityAlerts ?? 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-1 rounded-xl border border-[#e4ecf3] bg-[#f8fbff] px-4 py-2.5 text-sm text-[#506274]">
        <span>
          Verified employers:{" "}
          <strong className="font-semibold text-[#203142]">{summary?.verifiedEmployers ?? 0}</strong>
        </span>
        <span className="hidden h-3 w-px bg-[#dbe5ef] sm:block" />
        <span>
          Total applications:{" "}
          <strong className="font-semibold text-[#203142]">{summary?.totalApplications ?? 0}</strong>
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <PulseCard
          label="Pending verifications"
          value={summary?.pendingVerifications ?? 0}
          href="/admin/verifications"
          icon={BadgeCheck}
          accent="bg-amber-300"
        />
        <PulseCard
          label="Active job posts"
          value={summary?.activeJobs ?? 0}
          href="/admin/job-posts"
          icon={Briefcase}
          accent="bg-blue-300"
        />
        <PulseCard
          label="Open reports"
          value={openReports}
          href="/admin/reports"
          icon={Flag}
          accent="bg-violet-300"
        />
        <PulseCard
          label="Security alerts"
          value={activeAlerts}
          href="/admin/safety-security"
          icon={ShieldAlert}
          accent="bg-red-300"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <section className="overflow-hidden rounded-3xl border border-[#dbe5ef] bg-white shadow-sm xl:col-span-3">
          <div className="flex items-center justify-between gap-4 border-b border-[#eef3f8] px-6 py-5">
            <div>
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-[#2f6fa4]" />
                <h2 className="text-lg font-bold text-[#203142]">Recent Activity</h2>
              </div>
              <p className="mt-1 text-sm text-[#7b8ca0]">
                System-wide actions across employer, applicant, and admin flows.
              </p>
            </div>
            <Link
              href="/admin/audit-logs"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#f4f8fc] px-3 py-2 text-xs font-semibold text-[#2f6fa4] transition hover:bg-[#eef5fb]"
            >
              All logs
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="px-6 py-5">
            {isLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map((item) => (
                  <div key={item} className="flex gap-4">
                    <div className="h-9 w-9 animate-pulse rounded-xl bg-[#eef3f8]" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 w-3/4 animate-pulse rounded bg-[#eef3f8]" />
                      <div className="h-3 w-1/2 animate-pulse rounded bg-[#f4f8fc]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : auditLogs.length ? (
              <div>
                {auditLogs.map((log, index) => (
                  <ActivityTimelineItem key={log.id} log={log} isLast={index === auditLogs.length - 1} />
                ))}
                <ListPagination
                  currentPage={activityPage}
                  totalItems={allAuditLogs.length}
                  pageSize={ACTIVITY_PAGE_SIZE}
                  onPageChange={setActivityPage}
                />
              </div>
            ) : (
              <EmptyState
                title="No recent activity"
                copy="Admin activity will appear here once new actions are recorded."
              />
            )}
          </div>
        </section>

        <section className="overflow-hidden rounded-3xl border border-[#dbe5ef] bg-white shadow-sm xl:col-span-2">
          <div className="flex items-center justify-between gap-4 border-b border-[#eef3f8] px-6 py-5">
            <div>
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-[#2f6fa4]" />
                <h2 className="text-lg font-bold text-[#203142]">Review Queue</h2>
              </div>
              <p className="mt-1 text-sm text-[#7b8ca0]">
                Pending applicant and employer verifications.
              </p>
            </div>
            <Link
              href="/admin/verifications"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#2f6fa4] hover:underline"
            >
              Open queue
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="space-y-3 px-6 py-5">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="h-[4.5rem] animate-pulse rounded-2xl bg-[#eef3f8]" />
                ))}
              </div>
            ) : pendingVerifications.length ? (
              pendingVerifications.map((item) => <VerificationQueueItem key={item.id} item={item} />)
            ) : (
              <EmptyState
                title="Queue is clear"
                copy="Verification items will appear here when new accounts submit documents."
              />
            )}
          </div>
        </section>
      </div>

      <section className="overflow-hidden rounded-3xl border border-[#dbe5ef] bg-white shadow-sm">
        <div className="border-b border-[#eef3f8] px-6 py-5">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-[#2f6fa4]" />
            <h2 className="text-lg font-bold text-[#203142]">Quick Actions</h2>
          </div>
          <p className="mt-1 text-sm text-[#7b8ca0]">Jump directly into the areas that need admin attention.</p>
        </div>
        <div className="grid gap-3 p-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/admin/employers", label: "Review employers", icon: Building2 },
            { href: "/admin/applicants", label: "Manage applicants", icon: Users },
            { href: "/admin/job-posts", label: "Moderate job posts", icon: Briefcase },
            { href: "/admin/audit-logs", label: "View audit logs", icon: FileText },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-3 rounded-2xl border border-[#e5edf5] bg-[#f8fbff] px-4 py-3.5 transition hover:border-[#b9d0e8] hover:bg-white hover:shadow-sm"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#2f6fa4] shadow-sm">
                <item.icon className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-[#203142]">{item.label}</span>
              <ArrowRight className="ml-auto h-4 w-4 text-[#b9c9d9] transition group-hover:translate-x-0.5 group-hover:text-[#2f6fa4]" />
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
