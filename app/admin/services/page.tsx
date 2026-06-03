"use client";

import { AdminPanel, ActionButton, EmptyState, StatusBadge } from "../_components";
import { useAdminAction, useAdminPortal } from "../api-client-react";

export default function ServicesPage() {
  const { data } = useAdminPortal();
  const mutate = useAdminAction();

  return (
    <AdminPanel title="Services" description="Barangay-side services and support programs related to hiring.">
      <div className="space-y-3">
        {data?.services?.length ? data.services.map((service: any) => (
          <div key={service.id} className="flex flex-col gap-4 rounded-2xl border border-[#dfe8f0] bg-[#fbfdff] p-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="text-sm font-semibold text-[#29425e]">{service.title}</div>
              <div className="mt-1 text-xs text-[#7b8ca0]">{service.applications} linked applications</div>
            </div>
            <div className="flex items-center gap-3">
              <StatusBadge value={service.status} />
<ActionButton label="Pause" onClickAction={(e) => { e.stopPropagation(); mutate.mutate({ type: "service", id: service.id, status: "paused" }); }} />
              <ActionButton label="Activate" variant="default" onClickAction={(e) => { e.stopPropagation(); mutate.mutate({ type: "service", id: service.id, status: "active" }); }} />
            </div>
          </div>
        )) : <EmptyState title="No services" copy="Barangay support services will appear here." />}
      </div>
    </AdminPanel>
  );
}
