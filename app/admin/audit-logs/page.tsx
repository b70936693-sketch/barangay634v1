"use client";

import { format } from "date-fns";

import { AdminPanel, EmptyState } from "../_components";
import { useAdminPortal } from "../api-client-react";

export default function AuditLogsPage() {
  const { data } = useAdminPortal();

  return (
    <AdminPanel title="Audit Logs" description="Every important admin, employer, and applicant action recorded in one stream.">
      <div className="space-y-3">
        {data?.auditLogs?.length ? data.auditLogs.map((log: any) => (
          <div key={log.id} className="rounded-2xl border border-[#dfe8f0] bg-[#fbfdff] p-4">
            <div className="text-sm font-semibold text-[#29425e]">{log.action}</div>
            <div className="mt-1 text-xs text-[#7b8ca0]">{log.actor} • {log.target}</div>
            <div className="mt-2 text-xs text-[#93a2b3]">{format(new Date(log.createdAt), "MMMM d, yyyy h:mm a")}</div>
          </div>
        )) : <EmptyState title="No logs yet" copy="Audit entries will appear once users start taking actions." />}
      </div>
    </AdminPanel>
  );
}
