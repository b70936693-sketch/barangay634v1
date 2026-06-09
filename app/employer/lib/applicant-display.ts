export type ApplicantRecord = {
  id: string;
  fullName?: string;
  full_name?: string;
  appliedDate?: string;
  applied_date?: string;
  contact?: string;
  phone?: string;
  email?: string;
  status?: string;
  position?: string;
};

export function getApplicantName(applicant?: ApplicantRecord | null) {
  if (!applicant) return "";
  return applicant.fullName ?? applicant.full_name ?? "";
}

export function getApplicantAppliedDate(applicant?: ApplicantRecord | null) {
  if (!applicant) return "";
  return applicant.appliedDate ?? applicant.applied_date ?? "";
}

export function getApplicantContact(applicant?: ApplicantRecord | null) {
  if (!applicant) return "";
  return applicant.contact ?? applicant.phone ?? "";
}

export { buildSmsLink, buildTelLink, formatPhoneDisplay } from "@/lib/phone-links";
