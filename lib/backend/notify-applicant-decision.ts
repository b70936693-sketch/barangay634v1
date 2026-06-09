import "server-only";

import { sendApplicationDecisionEmail } from "./application-status-email";
import {
  buildDecisionNotification,
  createApplicationNotification,
  type ApplicationNotificationRecord,
} from "./notification-store";
import type { ApplicationRecord, EmployerProfile, JobPost, PortalDatabase } from "./types";

export type ApplicantDecisionResult = {
  notification: ApplicationNotificationRecord;
  emailSent: boolean;
  emailError?: string;
};

export async function notifyApplicantOfDecision(
  db: PortalDatabase,
  application: ApplicationRecord,
  decision: "hired" | "rejected",
): Promise<ApplicantDecisionResult | null> {
  if (decision !== "hired" && decision !== "rejected") {
    return null;
  }

  const jobPost = db.jobPosts.find((post) => post.id === application.jobPostId);
  if (!jobPost) return null;

  const employer =
    db.employerProfiles.find((profile) => profile.id === jobPost.employerId) ??
    db.employerProfiles.find((profile) => profile.userId === jobPost.employerId);

  const applicantProfile = db.applicantProfiles.find((profile) => profile.id === application.applicantId);
  const applicantUser = applicantProfile
    ? db.users.find((user) => user.id === applicantProfile.userId)
    : db.users.find((user) => user.email.toLowerCase() === application.email.toLowerCase());

  const emailResult = await sendApplicationDecisionEmail({
    application,
    jobPost,
    employer: employer ?? {
      id: jobPost.employerId,
      userId: jobPost.employerId,
      companyName: "Barangay 634 Employer",
      contactPerson: "Hiring Team",
      headline: "",
      location: "Barangay 634",
      verified: true,
      businessType: "Employer",
    },
    decision,
  });

  const notification = buildDecisionNotification({
    applicationId: application.id,
    applicantProfileId: application.applicantId,
    applicantUserId: applicantUser?.id ?? applicantProfile?.userId,
    applicantEmail: application.email,
    applicantName: application.fullName,
    jobTitle: jobPost.title || application.position,
    employerName: employer?.companyName ?? "Barangay 634 Employer",
    decision,
    emailSent: emailResult.sent,
    emailError: emailResult.error,
  });

  const saved = await createApplicationNotification(notification);

  return {
    notification: saved,
    emailSent: emailResult.sent,
    emailError: emailResult.error,
  };
}
