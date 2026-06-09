"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

import { AdminPanel, EmptyState, ListPagination } from "../_components";
import { useAdminPortal } from "../api-client-react";
import type { AuditLogRecord } from "@/lib/backend/types";

const PAGE_SIZE = 12;

export default function AuditLogsPage() {
  const { data, isLoading } = useAdminPortal();
  const [currentPage, setCurrentPage] = useState(1);

  const auditLogs = useMemo(() => {
    const logs = (Array.isArray(data?.auditLogs) ? data.auditLogs : []) as AuditLogRecord[];
    return [...logs].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
  }, [data?.auditLogs]);

  const totalPages = Math.max(1, Math.ceil(auditLogs.length / PAGE_SIZE));
  const visibleLogs = auditLogs.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  return (
    <AdminPanel
      title="Audit Logs"
      description={`${auditLogs.length} recorded action${auditLogs.length === 1 ? "" : "s"} across admin, employer, and applicant flows.`}
    >
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-20 animate-pulse rounded-2xl bg-[#eef4f9]" />
          ))}
        </div>
      ) : visibleLogs.length ? (
        <div className="space-y-3">
          {visibleLogs.map((log) => (
            <div key={log.id} className="rounded-2xl border border-[#dfe8f0] bg-[#fbfdff] p-4">
              <div className="text-sm font-semibold text-[#29425e]">{log.action}</div>
              <div className="mt-1 text-xs text-[#7b8ca0]">
                {log.actor} • {log.target}
              </div>
              <div className="mt-2 text-xs text-[#93a2b3]">
                {format(new Date(log.createdAt), "MMMM d, yyyy h:mm a")}
              </div>
            </div>
          ))}

          <ListPagination
            currentPage={currentPage}
            totalItems={auditLogs.length}
            pageSize={PAGE_SIZE}
            onPageChange={setCurrentPage}
          />
        </div>
      ) : (
        <EmptyState title="No logs yet" copy="Audit entries will appear once users start taking actions." />
      )}
    </AdminPanel>
  );
}
