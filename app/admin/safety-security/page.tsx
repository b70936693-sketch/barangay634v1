"use client";

import { AdminPanel, ActionButton, EmptyState, StatusBadge } from "../_components";
import { useAdminAction, useAdminPortal } from "../api-client-react";

export default function SafetySecurityPage() {
  const { data } = useAdminPortal();
  const mutate = useAdminAction();

  return (
    <AdminPanel title="Safety & Security Alerts" description="Live alerts tied to suspicious behavior across applications and accounts.">
      <div className="space-y-3">
        {data?.alerts?.length ? data.alerts.map((alert: any) => (
          <div key={alert.id} className="flex flex-col gap-4 rounded-2xl border border-[#dfe8f0] bg-[#fbfdff] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-[#29425e]">{alert.description}</div>
              <div className="mt-1 text-xs text-[#7b8ca0]">{alert.level} level alert</div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge value={alert.status} />
<ActionButton label="Monitor" onClickAction={(e) => { e.stopPropagation(); mutate.mutate({ type: "alert", id: alert.id, status: "monitoring" }); }} />
              <ActionButton label="Resolve" variant="default" onClickAction={(e) => { e.stopPropagation(); mutate.mutate({ type: "alert", id: alert.id, status: "resolved" }); }} />
            </div>
          </div>
        )) : <EmptyState title="No alerts" copy="System safety alerts will appear here when triggered." />}
      </div>
    </AdminPanel>
  );
}
