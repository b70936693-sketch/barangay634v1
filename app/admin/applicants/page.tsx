"use client";

import { useMemo, useState } from "react";

import { StatusBadge } from "../_components";
import { VerificationReviewModal } from "../_verification-review-modal";
import { useAdminPortal } from "../api-client-react";
import type { ApplicantProfile, ApplicationRecord, UserRecord, VerificationRecord } from "@/lib/backend/types";

type ApplicantView = {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  barangay: string;
  applications: number;
  submittedAt: string;
  verificationId: string | null;
  verificationStatus: "pending" | "approved" | "rejected" | null;
  verificationNotes: string;
  documentCount: number;
  latestApplicationStatus: string;
  latestAppliedAt: string;
};

export default function ApplicantsPage() {
  const { data, isLoading } = useAdminPortal();
  const [selectedApplicant, setSelectedApplicant] = useState<ApplicantView | null>(null);

  const applicants = useMemo<ApplicantView[]>(() => {
    const allUsers = (Array.isArray(data?.allUsers) ? data.allUsers : []) as UserRecord[];
    const profiles = (Array.isArray(data?.applicantProfiles) ? data.applicantProfiles : []) as ApplicantProfile[];
    const applications = (Array.isArray(data?.applications) ? data.applications : []) as ApplicationRecord[];
    const verifications = (Array.isArray(data?.verifications) ? data.verifications : []) as VerificationRecord[];

    return allUsers
      .filter((user) => user.role === "applicant")
      .map((user) => {
        const profile = profiles.find((item) => item.userId === user.id || item.email === user.email);
        const verification = verifications.find(
          (item) =>
            item.type === "Applicant Verification" &&
            (item.email?.toLowerCase() === user.email?.toLowerCase() || item.subjectName === user.fullName)
        );
        const applicantApplications = applications.filter((item) => item.email?.toLowerCase() === user.email?.toLowerCase());
        const latestApplication = applicantApplications
          .slice()
          .sort((a, b) => +new Date(b.appliedDate) - +new Date(a.appliedDate))[0];

        return {
          id: user.id,
          name: user.fullName,
          email: user.email,
          phone: profile?.phone ?? user.phone ?? "Not provided",
          address: profile?.address ?? "Not provided",
          barangay: profile?.barangay ?? "Not provided",
          applications: applicantApplications.length,
          submittedAt: verification?.submittedAt ?? user.createdAt,
          verificationId: verification?.id ?? null,
          verificationStatus: verification?.status ?? (user.status === "verified" ? "approved" : "pending"),
          verificationNotes: verification?.notes ?? "",
          documentCount: verification?.documents?.length ?? 0,
          latestApplicationStatus: latestApplication?.status ?? "no_application",
          latestAppliedAt: latestApplication?.appliedDate ?? "",
        };
      })
      .sort((a: ApplicantView, b: ApplicantView) => +new Date(b.submittedAt) - +new Date(a.submittedAt));
  }, [data]);

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-[#203142]">Applicant Management</h2>
            <p className="mt-1 text-sm text-[#7b8ca0]">
              Review applicant submissions, open uploaded documents, and approve or reject their verification.
            </p>
          </div>
          <div className="rounded-2xl bg-[#f4f8fc] px-4 py-3 text-sm font-medium text-[#47627f]">
            {applicants.length} applicants, {applicants.filter((item) => item.verificationStatus === "pending").length} pending review
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl border border-[#dbe5ef] bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-[#e8eef5]">
              <thead className="bg-[#f8fbff]">
                <tr className="text-left text-xs font-semibold uppercase tracking-[0.08em] text-[#6f849a]">
                  <th className="px-5 py-4">Applicant</th>
                  <th className="px-5 py-4">Contact</th>
                  <th className="px-5 py-4">Barangay</th>
                  <th className="px-5 py-4">Applications</th>
                  <th className="px-5 py-4">Documents</th>
                  <th className="px-5 py-4">Latest Hiring Status</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Submitted</th>
                  <th className="px-5 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef3f8]">
                {applicants.map((applicant) => (
                  <tr key={applicant.id} className="hover:bg-[#fbfdff]">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-[#203142]">{applicant.name}</div>
                      <div className="mt-1 text-xs text-[#7b8ca0]">{applicant.email}</div>
                    </td>
                    <td className="px-5 py-4 text-sm text-[#47627f]">{applicant.phone}</td>
                    <td className="px-5 py-4 text-sm text-[#47627f]">{applicant.barangay}</td>
                    <td className="px-5 py-4 text-sm font-semibold text-[#203142]">{applicant.applications}</td>
                    <td className="px-5 py-4 text-sm text-[#47627f]">{applicant.documentCount}</td>
                    <td className="px-5 py-4">
                      <StatusBadge value={applicant.latestApplicationStatus} />
                    </td>
                    <td className="px-5 py-4">
                      <StatusBadge value={applicant.verificationStatus ?? "pending"} />
                    </td>
                    <td className="px-5 py-4 text-sm text-[#47627f]">
                      {applicant.submittedAt ? new Date(applicant.submittedAt).toLocaleString() : "Unknown"}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => setSelectedApplicant(applicant)}
                        className="rounded-2xl bg-[#2f6fa4] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#244f7b]"
                      >
                        Review Submission
                      </button>
                    </td>
                  </tr>
                ))}
                {!isLoading && applicants.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-5 py-12 text-center text-sm text-[#6f849a]">
                      No applicant accounts found yet.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <VerificationReviewModal
        open={Boolean(selectedApplicant)}
        onCloseAction={() => setSelectedApplicant(null)}
        title={selectedApplicant?.name ?? "Applicant Submission"}
        subtitle="Applicant verification details, supporting documents, and review controls."
        fields={[
          { label: "Email", value: selectedApplicant?.email ?? "" },
          { label: "Phone", value: selectedApplicant?.phone ?? "" },
          { label: "Address", value: selectedApplicant?.address ?? "" },
          { label: "Barangay", value: selectedApplicant?.barangay ?? "" },
          { label: "Applications", value: String(selectedApplicant?.applications ?? 0) },
          { label: "Latest Hiring Status", value: selectedApplicant?.latestApplicationStatus ?? "no_application" },
          { label: "Documents", value: String(selectedApplicant?.documentCount ?? 0) },
        ]}
        verification={{
          id: selectedApplicant?.verificationId ?? null,
          type: "Applicant Verification",
          status: selectedApplicant?.verificationStatus ?? null,
          submittedAt: selectedApplicant?.submittedAt ?? null,
          notes: selectedApplicant?.verificationNotes ?? "",
        }}
      />
    </>
  );
}
