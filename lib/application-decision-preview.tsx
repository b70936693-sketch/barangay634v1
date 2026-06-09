"use client";

import { buildApplicationDecisionEmail } from "@/lib/application-decision-content";

type DecisionPreviewProps = {
  applicantName: string;
  applicantEmail: string;
  jobTitle: string;
  employerName: string;
  decision: "hired" | "rejected";
};

export function ApplicationDecisionPreview({
  applicantName,
  applicantEmail,
  jobTitle,
  employerName,
  decision,
}: DecisionPreviewProps) {
  const email = buildApplicationDecisionEmail({
    application: {
      id: "preview",
      jobPostId: "preview",
      applicantId: "preview",
      fullName: applicantName,
      email: applicantEmail,
      contact: "",
      position: jobTitle,
      appliedDate: new Date().toISOString(),
      status: decision,
      availability: "",
      shiftPreference: "",
      introduction: "",
      documents: [],
    },
    jobPost: {
      id: "preview",
      employerId: "preview",
      title: jobTitle,
      position: jobTitle,
      postType: "establishment_job",
      createdAt: new Date().toISOString(),
      status: "active",
      qualifications: "",
      requirements: "",
      description: "",
      employmentType: "",
      schedule: "",
      salary: "",
      urgency: "",
      benefits: [],
      employerRequirements: [],
      adminRequirements: [],
    },
    employer: {
      id: "preview",
      userId: "preview",
      companyName: employerName,
      contactPerson: "Hiring Team",
      headline: "",
      location: "Barangay 634",
      verified: true,
      businessType: "Employer",
    },
    decision,
  });

  const isHired = decision === "hired";
  const actionUrl = isHired ? email.applicationsUrl : email.discoverUrl;

  return (
    <div className="space-y-3 rounded-lg border border-border bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Email preview</p>

      <div className="space-y-1.5 text-sm">
        <p>
          <span className="text-muted-foreground">To:</span> {applicantEmail}
        </p>
        <p>
          <span className="text-muted-foreground">Subject:</span> {email.subject}
        </p>
      </div>

      <div className="rounded-md border border-border bg-white p-4 text-sm leading-relaxed text-foreground">
        <p>Hi {email.applicantName},</p>
        <p className="mt-3">
          {isHired ? (
            <>
              Great news from <span className="font-medium">{email.company}</span>. You have been selected for the{" "}
              <span className="font-medium">{email.position}</span> role.
            </>
          ) : (
            <>
              Thank you for applying to <span className="font-medium">{email.position}</span> at{" "}
              <span className="font-medium">{email.company}</span>. The employer has decided not to move forward with
              your application for this role.
            </>
          )}
        </p>

        {isHired ? (
          <ul className="mt-3 list-disc space-y-1 pl-5 text-muted-foreground">
            {email.nextSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ul>
        ) : null}

        <p className="mt-4 text-muted-foreground">
          {isHired ? "View your application:" : "Browse jobs:"}{" "}
          <a
            href={actionUrl}
            target="_blank"
            rel="noreferrer"
            className="break-all font-medium text-[#2f6fa4] underline-offset-4 hover:underline"
          >
            {actionUrl}
          </a>
        </p>
      </div>
    </div>
  );
}
