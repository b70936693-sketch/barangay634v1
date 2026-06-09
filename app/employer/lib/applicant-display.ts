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

export function getApplicantName(applicant: ApplicantRecord) {
  return applicant.fullName ?? applicant.full_name ?? "";
}

export function getApplicantAppliedDate(applicant: ApplicantRecord) {
  return applicant.appliedDate ?? applicant.applied_date ?? "";
}

export function getApplicantContact(applicant: ApplicantRecord) {
  return applicant.contact ?? applicant.phone ?? "";
}
