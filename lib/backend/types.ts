export type Role = "admin" | "employer" | "applicant";

export type UserRecord = {
  id: string;
  role: Role;
  fullName: string;
  email: string;
  phone: string;
  status: "active" | "pending" | "verified" | "suspended";
  createdAt: string;
};

export type EmployerProfile = {
  id: string;
  userId: string;
  companyName: string;
  contactPerson: string;
  headline: string;
  location: string;
  verified: boolean;
  businessType: string;
};

export type ApplicantProfile = {
  id: string;
  userId: string;
  fullName: string;
  preferredName: string;
  email: string;
  phone: string;
  barangay: string;
  address: string;
  headline: string;
  bio: string;
  skills: string[];
  documentsReady: string[];
};

export type JobPost = {
  id: string;
  employerId: string;
  title: string;
  position: string;
  postType: "establishment_job" | "resident_service";
  createdAt: string;
  status: "active" | "pending" | "closed" | "rejected";
  qualifications: string;
  requirements: string;
  description: string;
  employmentType: string;
  schedule: string;
  salary: string;
  urgency: string;
  benefits: string[];
  employerRequirements: string[];
  adminRequirements: string[];
  rejectionNotes?: string;
  publishedAt?: string | null;
  postingStartDate?: string | null;
  postingEndDate?: string | null;
  shifts?: string[];
  pwdFriendly?: boolean;
  seniorFriendly?: boolean;
  accessibilityFeatures?: string[];
};

export type JobPostStatus = JobPost["status"];

export type ApplicationDocument = {
  id: string;
  name: string;
  path?: string;
  url?: string;
};

export type ApplicationRecord = {
  id: string;
  jobPostId: string;
  applicantId: string;
  fullName: string;
  email: string;
  contact: string;
  position: string;
  appliedDate: string;
  status: "pending" | "reviewing" | "for_interview" | "hired" | "rejected";
  availability: string;
  shiftPreference: string;
  introduction: string;
  documents: ApplicationDocument[];
};

export type InterviewRecord = {
  id: string;
  applicationId: string;
  applicantName: string;
  position: string;
  contact: string;
  interviewDate: string;
  interviewTime: string;
  location: string;
};

export type VerificationRecord = {
  id: string;
  type: "Applicant Verification" | "Employer Verification";
  subjectName: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
  email?: string;
  documents?: string[];
  notes?: string;
  inviteToken?: string | null;
  inviteSentAt?: string | null;
  approvedAt?: string | null;
  rejectedAt?: string | null;
};

export type ReportRecord = {
  id: string;
  category: string;
  subject: string;
  severity: "low" | "medium" | "high";
  status: "open" | "in_review" | "resolved";
  createdAt: string;
};

export type AlertRecord = {
  id: string;
  description: string;
  level: "low" | "medium" | "high";
  status: "active" | "monitoring" | "resolved";
  createdAt: string;
};

export type AuditLogRecord = {
  id: string;
  action: string;
  actor: string;
  target: string;
  createdAt: string;
};

export type ServiceRecord = {
  id: string;
  title: string;
  applications: number;
  status: "active" | "paused";
};

export type PortalDatabase = {
  users: UserRecord[];
  employerProfiles: EmployerProfile[];
  applicantProfiles: ApplicantProfile[];
  jobPosts: JobPost[];
  applications: ApplicationRecord[];
  interviews: InterviewRecord[];
  verifications: VerificationRecord[];
  reports: ReportRecord[];
  alerts: AlertRecord[];
  auditLogs: AuditLogRecord[];
  services: ServiceRecord[];
};
