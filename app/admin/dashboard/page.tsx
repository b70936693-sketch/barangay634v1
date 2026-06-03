"use client";

import Link from "next/link";

import { AdminPanel, EmptyState, StatusBadge } from "../_components";
import { useAdminPortal } from "../api-client-react";

export default function AdminDashboardPage() {
  const { data } = useAdminPortal();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <AdminPanel title="Recent Activity" description="System-wide actions across employer, applicant, and admin flows.">
          <div className="space-y-3">
            {data?.recentActivity?.length ? (
              data.recentActivity.map((activity: any) => (
                <div key={activity.id} className="rounded-2xl border border-[#e2e9f0] bg-[#fbfdff] p-4">
                  <div className="text-sm font-medium text-[#29425e]">{activity.description}</div>
                  <div className="mt-1 text-xs text-[#7b8ca0]">{activity.timeAgo}</div>
                </div>
              ))
            ) : (
              <EmptyState title="No recent activity" copy="Admin activity will appear here once new actions are recorded." />
            )}
          </div>
        </AdminPanel>

        <AdminPanel
          title="Pending Verifications"
          description="Current review queue shared across applicants and employers."
          action={<Link href="/admin/verifications" className="text-sm font-semibold text-[#2f6fa4]">Open Queue</Link>}
        >
          <div className="space-y-3">
            {data?.verifications?.length ? (
              data.verifications.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between rounded-2xl border border-[#e2e9f0] bg-[#fbfdff] p-4">
                  <div>
                    <div className="text-sm font-medium text-[#29425e]">{item.subjectName}</div>
                    <div className="mt-1 text-xs text-[#7b8ca0]">{item.type}</div>
                  </div>
                  <StatusBadge value={item.status} />
                </div>
              ))
            ) : (
              <EmptyState title="No pending queue" copy="Verification items will appear here when new accounts submit documents." />
            )}
          </div>
        </AdminPanel>
      </div>
    </div>
  );
}
