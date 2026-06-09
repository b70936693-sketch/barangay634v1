import { getApplicantApplicationsUrl, getApplicantDiscoverUrl } from "@/lib/app-url";
import type { ApplicationRecord, EmployerProfile, JobPost } from "@/lib/backend/types";

export type ApplicationDecisionType = "hired" | "rejected";

export type ApplicationDecisionContext = {
  application: ApplicationRecord;
  jobPost: JobPost;
  employer: EmployerProfile;
  decision: ApplicationDecisionType;
};

export type ApplicationDecisionEmail = {
  subject: string;
  text: string;
  html: string;
  applicationsUrl: string;
  discoverUrl: string;
  applicantName: string;
  company: string;
  position: string;
  nextSteps: string[];
};

export function buildApplicationDecisionEmail(context: ApplicationDecisionContext): ApplicationDecisionEmail {
  const { application, jobPost, employer, decision } = context;
  const position = jobPost.title || application.position;
  const company = employer.companyName || "Barangay 634 Employer";
  const applicantName = application.fullName || "Applicant";
  const applicationsUrl = getApplicantApplicationsUrl();
  const discoverUrl = getApplicantDiscoverUrl();

  if (decision === "hired") {
    const nextSteps = [
      "Check your applicant portal for full details",
      "Prepare any documents your employer may request",
      "Watch for onboarding instructions from the employer",
    ];

    const subject = `Congratulations! You are hired for ${position}`;
    const text = [
      `Hi ${applicantName},`,
      "",
      `Great news from ${company}!`,
      `You have been selected for the ${position} role at Barangay 634.`,
      "",
      "Next steps:",
      ...nextSteps.map((step) => `- ${step}`),
      "",
      `View your application: ${applicationsUrl}`,
      "",
      "Thank you for using Barangay 634 Job Portal.",
    ].join("\n");

    const html = `
      <div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#f4f8fc;padding:32px 16px;">
        <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #d9e6f2;border-radius:20px;overflow:hidden;">
          <div style="background:linear-gradient(135deg,#2f6fa4,#1f4f7b);padding:28px 24px;color:#ffffff;">
            <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.8;">Barangay 634</p>
            <h1 style="margin:0;font-size:24px;line-height:1.3;">You are hired!</h1>
          </div>
          <div style="padding:24px;color:#24364a;line-height:1.6;">
            <p>Hi <strong>${applicantName}</strong>,</p>
            <p><strong>${company}</strong> has selected you for the <strong>${position}</strong> role.</p>
            <div style="margin:20px 0;padding:16px;border-radius:14px;background:#ecfbf0;border:1px solid #bfe9cb;">
              <p style="margin:0;color:#2f6b45;"><strong>What happens next</strong></p>
              <ul style="margin:12px 0 0;padding-left:20px;color:#3d5a49;">
                ${nextSteps.map((step) => `<li>${step}</li>`).join("")}
              </ul>
            </div>
            <a href="${applicationsUrl}" style="display:inline-block;margin-top:8px;padding:12px 18px;background:#2f6fa4;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:600;">Open My Applications</a>
          </div>
        </div>
      </div>
    `;

    return { subject, text, html, applicationsUrl, discoverUrl, applicantName, company, position, nextSteps };
  }

  const nextSteps = [
    "Keep your profile and documents up to date",
    "Explore newly posted roles in your barangay",
    "Apply again when a better match appears",
  ];

  const subject = `Update on your application for ${position}`;
  const text = [
    `Hi ${applicantName},`,
    "",
    `Thank you for applying to ${position} at ${company}.`,
    "After careful review, the employer has decided to move forward with other candidates for this role.",
    "",
    "We encourage you to keep exploring opportunities on Barangay 634 — new roles are posted regularly.",
    "",
    `Browse jobs: ${discoverUrl}`,
    "",
    "Thank you for your interest and effort.",
  ].join("\n");

  const html = `
    <div style="font-family:Inter,Segoe UI,Arial,sans-serif;background:#f8f4f4;padding:32px 16px;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border:1px solid #ead9d9;border-radius:20px;overflow:hidden;">
        <div style="background:linear-gradient(135deg,#8b4f4f,#6a3a3a);padding:28px 24px;color:#ffffff;">
          <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.12em;text-transform:uppercase;opacity:0.8;">Barangay 634</p>
          <h1 style="margin:0;font-size:24px;line-height:1.3;">Application update</h1>
        </div>
        <div style="padding:24px;color:#24364a;line-height:1.6;">
          <p>Hi <strong>${applicantName}</strong>,</p>
          <p>Thank you for applying to <strong>${position}</strong> at <strong>${company}</strong>.</p>
          <p>After review, the employer has decided not to move forward with your application for this role at this time.</p>
          <div style="margin:20px 0;padding:16px;border-radius:14px;background:#fff7f5;border:1px solid #f2d4cf;">
            <p style="margin:0;color:#7a4b45;">Keep going — new local opportunities are added regularly on Barangay 634.</p>
          </div>
          <a href="${discoverUrl}" style="display:inline-block;margin-top:8px;padding:12px 18px;background:#2f6fa4;color:#ffffff;text-decoration:none;border-radius:999px;font-weight:600;">Discover More Jobs</a>
        </div>
      </div>
    </div>
  `;

  return { subject, text, html, applicationsUrl, discoverUrl, applicantName, company, position, nextSteps };
}
