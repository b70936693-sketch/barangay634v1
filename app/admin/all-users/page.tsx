"use client";

import { ApplicantAvatar } from "@/components/applicant-avatar";
import { EmployerAvatar } from "@/components/employer-avatar";
import { AdminPanel, EmptyState, StatusBadge } from "../_components";
import { useAdminPortal } from "../api-client-react";

export default function AllUsersPage() {
  const { data } = useAdminPortal();

  return (
    <AdminPanel title="All Users" description="View and manage all user accounts in your organization.">
      <div className="space-y-3">
        {data?.allUsers?.length ? data.allUsers.map((user: any) => (
          <div key={user.id} className="grid gap-4 rounded-2xl border border-[#dfe8f0] bg-[#fbfdff] p-4 md:grid-cols-[minmax(0,1fr)_120px_120px] md:items-center">
            <div className="flex items-center gap-3">
              {user.role === "employer" ? (
                <EmployerAvatar name={user.fullName} logoUrl={user.logoUrl} size="sm" />
              ) : user.role === "applicant" ? (
                <ApplicantAvatar name={user.fullName} photoUrl={user.photoUrl} size="sm" />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-[#e8f0f6] bg-[#eef5fb] text-sm font-semibold text-[#2f6fa4]">
                  {(user.fullName || "U").charAt(0)}
                </div>
              )}
              <div>
                <div className="text-sm font-semibold text-[#29425e]">{user.fullName}</div>
                <div className="mt-1 text-xs text-[#7b8ca0]">{user.email}</div>
              </div>
            </div>
            <StatusBadge value={user.role} />
            <StatusBadge value={user.status} />
          </div>
        )) : <EmptyState title="No users" copy="User accounts will appear here." />}
      </div>
    </AdminPanel>
  );
}
