"use client";

import { useMemo, useState } from "react";

import { StatusBadge } from "../_components";
import { VerificationReviewModal } from "../_verification-review-modal";
import { useAdminPortal } from "../api-client-react";
import type { UserRecord, VerificationRecord } from "@/lib/backend/types";

type EmployerView = {
  id: string;
  companyName: string;
  contactPerson: string;
  email: string;
  businessType: string;
  location: string;
  applications: number;
  submittedAt: string;
  verificationId: string | null;
  verificationStatus: "pending" | "approved" | "rejected" | null;
  verificationNotes: string;
  documentCount: number;
};

type EmployerPortalRow = {
  id: string;
  userId: string;
  companyName: string;
  contactPerson: string;
  businessType: string;
  location: string;
  verified: boolean;
  count_applications: number;
};

export default function EmployersPage() {
  const { data, isLoading } = useAdminPortal();
  const [selectedEmployer, setSelectedEmployer] = useState<EmployerView | null>(null);

  const employers = useMemo<EmployerView[]>(() => {
    const employerProfiles = (Array.isArray(data?.employers) ? data.employers : []) as EmployerPortalRow[];
    const users = (Array.isArray(data?.allUsers) ? data.allUsers : []) as UserRecord[];
    const verifications = (Array.isArray(data?.verifications) ? data.verifications : []) as VerificationRecord[];

    return employerProfiles
      .map((profile) => {
        const user = users.find((item) => item.id === profile.userId);
        const verification = verifications.find(
          (item) =>
            item.type === "Employer Verification" &&
            (item.email?.toLowerCase() === user?.email?.toLowerCase() ||
              item.subjectName === profile.companyName ||
              item.subjectName === profile.contactPerson ||
              item.subjectName === user?.fullName)
        );

        return {
          id: profile.id,
          companyName: profile.companyName,
          contactPerson: profile.contactPerson,
          email: user?.email ?? "Not provided",
          businessType: profile.businessType ?? "Not provided",
          location: profile.location ?? "Not provided",
          applications: profile.count_applications ?? 0,
          submittedAt: verification?.submittedAt ?? user?.createdAt ?? "",
          verificationId: verification?.id ?? null,
          verificationStatus: verification?.status ?? (profile.verified ? "approved" : "pending"),
          verificationNotes: verification?.notes ?? "",
          documentCount: verification?.documents?.length ?? 0,
        };
      })
      .sort((a: EmployerView, b: EmployerView) => +new Date(b.submittedAt || 0) - +new Date(a.submittedAt || 0));
  }, [data]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#203142]">Employer Accounts</h2>
            <p className="mt-1 text-sm text-[#7b8ca0]">
              Review employer onboarding submissions, inspect uploaded IDs, and verify or reject employer access.
            </p>
          </div>
          <div className="rounded-2xl bg-[#f4f8fc] px-4 py-3 text-sm font-medium text-[#47627f]">
            {employers.length} employers, {employers.filter((item) => item.verificationStatus === "pending").length} pending review
          </div>
        </div>

        <div className="grid gap-4">
          {employers.map((employer) => (
            <div
              key={employer.id}
              className="grid gap-4 rounded-3xl border border-[#dbe5ef] bg-[#fbfdff] p-5 md:grid-cols-[minmax(0,1.3fr)_140px_140px_160px] md:items-center"
            >
              <div className="min-w-0">
                <div className="text-base font-semibold text-[#203142]">{employer.companyName}</div>
                <div className="mt-1 text-sm text-[#47627f]">
                  {employer.contactPerson} • {employer.businessType}
                </div>
                <div className="mt-1 text-xs text-[#7b8ca0]">
                  {employer.email} • {employer.location}
                </div>
              </div>
              <div className="text-sm font-semibold text-[#203142]">{employer.applications} applications</div>
              <div className="text-sm text-[#47627f]">{employer.documentCount} documents</div>
              <div className="flex items-center justify-between gap-3 md:justify-end">
                <StatusBadge value={employer.verificationStatus ?? "pending"} />
                <button
                  type="button"
                  onClick={() => setSelectedEmployer(employer)}
                  className="rounded-2xl bg-[#2f6fa4] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#244f7b]"
                >
                  Review
                </button>
              </div>
            </div>
          ))}

          {!isLoading && employers.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#dbe5ef] bg-[#f7fbff] p-8 text-center text-sm text-[#5f738c]">
              No employers found yet.
            </div>
          ) : null}
        </div>
      </div>

      <VerificationReviewModal
        open={Boolean(selectedEmployer)}
        onCloseAction={() => setSelectedEmployer(null)}
        title={selectedEmployer?.companyName ?? "Employer Submission"}
        subtitle="Employer verification details, uploaded files, and admin review controls."
        employerId={selectedEmployer?.id ?? null}
        fields={[
          { label: "Contact Person", value: selectedEmployer?.contactPerson ?? "" },
          { label: "Email", value: selectedEmployer?.email ?? "" },
          { label: "Business Type", value: selectedEmployer?.businessType ?? "" },
          { label: "Location", value: selectedEmployer?.location ?? "" },
          { label: "Applications", value: String(selectedEmployer?.applications ?? 0) },
          { label: "Documents", value: String(selectedEmployer?.documentCount ?? 0) },
        ]}
        verification={{
          id: selectedEmployer?.verificationId ?? null,
          type: "Employer Verification",
          status: selectedEmployer?.verificationStatus ?? null,
          submittedAt: selectedEmployer?.submittedAt ?? null,
          notes: selectedEmployer?.verificationNotes ?? "",
        }}
      />
    </>
  );
}

