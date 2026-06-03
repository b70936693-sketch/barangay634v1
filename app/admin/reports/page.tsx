"use client";

import { AdminPanel, ActionButton, EmptyState, StatusBadge } from "../_components";
import { useAdminAction, useAdminPortal } from "../api-client-react";

export default function ReportsPage() {
  const { data } = useAdminPortal();
  const mutate = useAdminAction();

  return (
    <AdminPanel title="Reports & Escalations" description="Handle flagged incidents and platform moderation cases.">
      <div className="space-y-3">
        {data?.reports?.length ? data.reports.map((report: any) => (
          <div key={report.id} className="flex flex-col gap-4 rounded-2xl border border-[#dfe8f0] bg-[#fbfdff] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-[#29425e]">{report.subject}</div>
              <div className="mt-1 text-xs text-[#7b8ca0]">{report.category} • {report.severity} severity</div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge value={report.status} />
<ActionButton label="Mark In Review" onClickAction={(e) => { e.stopPropagation(); mutate.mutate({ type: "report", id: report.id, status: "in_review" }); }} />
              <ActionButton label="Resolve" variant="default" onClickAction={(e) => { e.stopPropagation(); mutate.mutate({ type: "report", id: report.id, status: "resolved" }); }} />
            </div>
          </div>
        )) : <EmptyState title="No reports" copy="Escalations and moderation cases will show up here." />}
      </div>
    </AdminPanel>
  );
}
