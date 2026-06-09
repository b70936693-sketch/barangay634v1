import "server-only";

import { buildApplicationDecisionEmail } from "@/lib/application-decision-content";
import { sendEmail } from "@/lib/server/send-email";
import type { ApplicationRecord, EmployerProfile, JobPost } from "./types";

export type ApplicationDecisionType = "hired" | "rejected";

export type ApplicationDecisionContext = {
  application: ApplicationRecord;
  jobPost: JobPost;
  employer: EmployerProfile;
  decision: ApplicationDecisionType;
};

export { buildApplicationDecisionEmail };

export async function sendApplicationDecisionEmail(context: ApplicationDecisionContext) {
  const emailContent = buildApplicationDecisionEmail(context);
  const result = await sendEmail({
    to: context.application.email,
    subject: emailContent.subject,
    html: emailContent.html,
    text: emailContent.text,
  });

  return {
    ...result,
    subject: emailContent.subject,
    previewText: emailContent.text,
  };
}
