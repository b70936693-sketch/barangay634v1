"use client";

import { EmployerAvatar } from "@/components/employer-avatar";
import { AdminPanel, EmptyState, StatusBadge } from "../_components";
import { useAdminPortal } from "../api-client-react";

export default function AllListingsPage() {
  const { data } = useAdminPortal();

  return (
    <AdminPanel title="All Listings" description="Combined listing view for admin review.">
      <div className="space-y-3">
        {data?.jobPosts?.length ? data.jobPosts.map((post: any) => (
          <div key={post.id} className="grid gap-4 rounded-2xl border border-[#dfe8f0] bg-[#fbfdff] p-4 md:grid-cols-[minmax(0,1fr)_120px_120px] md:items-center">
            <div className="flex items-center gap-3">
              <EmployerAvatar name={post.companyName} logoUrl={post.employerLogoUrl} size="sm" />
              <div>
                <div className="text-sm font-semibold text-[#29425e]">{post.title}</div>
                <div className="mt-1 text-xs text-[#7b8ca0]">{post.companyName} • {post.position}</div>
              </div>
            </div>
            <div className="text-sm font-medium text-[#29425e]">{post.applicantCount} applicants</div>
            <StatusBadge value={post.status} />
          </div>
        )) : <EmptyState title="No listings" copy="Employer listings will appear here once posted." />}
      </div>
    </AdminPanel>
  );
}
