"use client";

import { AdminPanel, EmptyState, StatusBadge } from "../_components";
import { useAdminPortal } from "../api-client-react";

export default function AllUsersPage() {
  const { data } = useAdminPortal();

  return (
    <AdminPanel title="All Users" description="View and manage all user accounts in your organization.">
      <div className="space-y-3">
        {data?.allUsers?.length ? data.allUsers.map((user: any) => (
          <div key={user.id} className="grid gap-4 rounded-2xl border border-[#dfe8f0] bg-[#fbfdff] p-4 md:grid-cols-[minmax(0,1fr)_120px_120px] md:items-center">
            <div>
              <div className="text-sm font-semibold text-[#29425e]">{user.fullName}</div>
              <div className="mt-1 text-xs text-[#7b8ca0]">{user.email}</div>
            </div>
            <StatusBadge value={user.role} />
            <StatusBadge value={user.status} />
          </div>
        )) : <EmptyState title="No users" copy="User accounts will appear here." />}
      </div>
    </AdminPanel>
  );
}
