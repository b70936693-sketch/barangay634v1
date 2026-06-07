 import "server-only";

import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import { PrismaClient, VerificationType } from "@prisma/client";
import { prisma } from "./prisma";
import { supabaseAdmin } from "@/lib/supabase-server";
import { seedDatabase } from "./seed";
import { AlertRecord, ApplicationDocument, ApplicationRecord, ApplicantProfile, AuditLogRecord, EmployerProfile, InterviewRecord, JobPost, JobPostStatus, PortalDatabase, ReportRecord, ServiceRecord, UserRecord, VerificationRecord } from "./types";

const dataDir = path.join(process.cwd(), "data");
const dbPath = path.join(dataDir, "portal-db.json");


async function ensureDbFile() {
  await mkdir(dataDir, { recursive: true });

  try {
    await readFile(dbPath, "utf8");
  } catch {
    await writeFile(dbPath, JSON.stringify(seedDatabase, null, 2), "utf8");
  }
}

function normalizeArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function normalizeTimestamp(value: unknown): string {
  if (value === undefined || value === null) {
    return new Date().toISOString();
  }

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? new Date().toISOString() : date.toISOString();
}

function normalizeOptionalTimestamp(value: unknown): string | null {
  if (value === undefined || value === null) {
    return null;
  }

  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function mapUserRow(row: unknown): UserRecord {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    role: r.role as UserRecord["role"],
    fullName: (r.full_name ?? r.fullName ?? "") as string,
    email: (r.email ?? "") as string,
    phone: (r.phone ?? "") as string,
    status: r.status as UserRecord["status"],
    createdAt: normalizeTimestamp((r.created_at ?? r.createdAt) as unknown),
  };
}

function mapEmployerRow(row: unknown): EmployerProfile {
  const r = row as Record<string, unknown>;
  
  return {
    id: r.id as string,
    userId: (r.user_id ?? r.userId ?? "") as string,
    companyName: (r.company_name ?? r.companyName ?? "") as string,
    contactPerson: (r.contact_person ?? r.contactPerson ?? "") as string,
    headline: (r.headline ?? "") as string,
    location: (r.location ?? "") as string,
    verified: Boolean(r.verified),
    businessType: (r.business_type ?? r.businessType ?? "") as string,
  };
}

function mapApplicantRow(row: unknown): ApplicantProfile {
  const r = row as Record<string, unknown>;
  
  return {
    id: r.id as string,
    userId: (r.user_id ?? r.userId ?? "") as string,
    fullName: (r.full_name ?? r.fullName ?? "") as string,
    preferredName: (r.preferred_name ?? r.preferredName ?? "") as string,
    email: (r.email ?? "") as string,
    phone: (r.phone ?? "") as string,
    barangay: (r.barangay ?? "") as string,
    address: (r.address ?? "") as string,
    headline: (r.headline ?? "") as string,
    bio: (r.bio ?? "") as string,
    skills: normalizeArray<string>(r.skills ?? r.skills ?? []),
    documentsReady: normalizeArray<string>(r.documents_ready ?? r.documentsReady ?? []),
  };
}

function mapJobPostRow(row: unknown): JobPost {
  const r = row as Record<string, unknown>;
  
  return {
    id: r.id as string,
    employerId: (r.employer_id ?? r.employerId ?? "") as string,
    title: (r.title ?? "") as string,
    position: (r.position ?? "") as string,
    postType: (r.post_type ?? r.postType) as JobPost["postType"],
    createdAt: normalizeTimestamp((r.created_at ?? r.createdAt) as unknown),
    status: r.status as JobPost["status"],
    qualifications: (r.qualifications ?? "") as string,
    requirements: (r.requirements ?? "") as string,
    description: (r.description ?? "") as string,
    employmentType: (r.employment_type ?? r.employmentType ?? "") as string,
    schedule: (r.schedule ?? "") as string,
    salary: (r.salary ?? "") as string,
    urgency: (r.urgency ?? "") as string,
    benefits: normalizeArray<string>(r.benefits ?? r.benefits ?? []),
    employerRequirements: normalizeArray<string>(r.employer_requirements ?? r.employerRequirements ?? []),
    adminRequirements: normalizeArray<string>(r.admin_requirements ?? r.adminRequirements ?? []),
    rejectionNotes: (r.rejection_notes ?? r.rejectionNotes ?? "") as string,
    publishedAt: normalizeOptionalTimestamp(r.published_at ?? r.publishedAt ?? null),
  };
}

function mapApplicationRow(row: unknown): ApplicationRecord {
  const r = row as Record<string, unknown>;
  
  const rawDocuments = r.documents ?? r.documents ?? [];
  const normalizedDocuments = normalizeArray<unknown>(rawDocuments);

  return {
    id: r.id as string,
    jobPostId: (r.job_post_id ?? r.jobPostId ?? "") as string,
    applicantId: (r.applicant_id ?? r.applicantId ?? "") as string,
    fullName: (r.full_name ?? r.fullName ?? "") as string,
    email: (r.email ?? "") as string,
    contact: (r.contact ?? "") as string,
    position: (r.position ?? "") as string,
    appliedDate: normalizeTimestamp((r.applied_date ?? r.appliedDate) as unknown),
    status: r.status as ApplicationRecord["status"],
    availability: (r.availability ?? "") as string,
    shiftPreference: (r.shift_preference ?? r.shiftPreference ?? "") as string,
    introduction: (r.introduction ?? "") as string,
    documents: (normalizedDocuments.flat?.() ?? normalizedDocuments) as ApplicationDocument[],
  };
}

function mapInterviewRow(row: unknown): InterviewRecord {
  const r = row as Record<string, unknown>;
  
  return {
    id: r.id as string,
    applicationId: (r.application_id ?? r.applicationId ?? "") as string,
    applicantName: (r.applicant_name ?? r.applicantName ?? "") as string,
    position: (r.position ?? "") as string,
    contact: (r.contact ?? "") as string,
    interviewDate: (r.interview_date ?? r.interviewDate ?? "") as string,
    interviewTime: (r.interview_time ?? r.interviewTime ?? "") as string,
    location: (r.location ?? "") as string,
  };
}

function mapVerificationRow(row: unknown): VerificationRecord {
  const r = row as Record<string, unknown>;
  
  const type =
    r.type === "ApplicantVerification"
      ? "Applicant Verification"
      : r.type === "EmployerVerification"
      ? "Employer Verification"
      : (r.type as VerificationRecord["type"]);

  const rawStatus = r.status;
  const normalizedStatus = (() => {
    const s = String(rawStatus ?? "").trim().toLowerCase();

    if (!s) return "pending" as const;

    // Accept common variants coming from older seeds/migrations.
    if (s === "pending" || s.includes("pending")) return "pending" as const;
    if (s === "approved" || s.includes("approved")) return "approved" as const;
    if (s === "rejected" || s.includes("rejected") || s.includes("denied")) return "rejected" as const;

    // Fallback: default to pending so the queue still surfaces the record.
    return "pending" as const;
  })();

  return {
    id: r.id as string,
    type,
    subjectName: (r.subject_name ?? r.subjectName ?? "") as string,
    status: normalizedStatus,
    submittedAt: normalizeTimestamp((r.submitted_at ?? r.submittedAt) as unknown),
    email: (r.email ?? r.email_address ?? r.emailAddress) as string | undefined,
    documents: normalizeArray<string>(r.documents ?? r.documents ?? []),
    notes: (r.notes ?? r.notes) as string | undefined,
    inviteToken: (r.invite_token ?? r.inviteToken) as string | null,
    inviteSentAt: normalizeOptionalTimestamp((r.invite_sent_at ?? r.inviteSentAt ?? null) as unknown),
    approvedAt: normalizeOptionalTimestamp((r.approved_at ?? r.approvedAt ?? null) as unknown),
    rejectedAt: normalizeOptionalTimestamp((r.rejected_at ?? r.rejectedAt ?? null) as unknown),
  };
}

function mapReportRow(row: unknown): ReportRecord {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    category: (r.category ?? "") as string,
    subject: (r.subject ?? "") as string,
    severity: r.severity as ReportRecord["severity"],
    status: r.status as ReportRecord["status"],
    createdAt: normalizeTimestamp((r.created_at ?? r.createdAt) as unknown),
  };
}

function mapAlertRow(row: unknown): AlertRecord {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    description: (r.description ?? "") as string,
    level: r.level as AlertRecord["level"],
    status: r.status as AlertRecord["status"],
    createdAt: normalizeTimestamp((r.created_at ?? r.createdAt) as unknown),
  };
}

function mapAuditLogRow(row: unknown): AuditLogRecord {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    action: (r.action ?? "") as string,
    actor: (r.actor ?? "") as string,
    target: (r.target ?? "") as string,
    createdAt: normalizeTimestamp((r.created_at ?? r.createdAt) as unknown),
  };
}

function mapServiceRow(row: unknown): ServiceRecord {
  const r = row as Record<string, unknown>;
  return {
    id: r.id as string,
    title: (r.title ?? "") as string,
    applications: Number(r.applications ?? 0),
    status: r.status as ServiceRecord["status"],
  };
}

function normalizeDatabase(db: PortalDatabase): PortalDatabase {
  return {
    users: normalizeArray<UserRecord>(db.users).map(mapUserRow),
    employerProfiles: normalizeArray<EmployerProfile>(db.employerProfiles).map(mapEmployerRow),
    applicantProfiles: normalizeArray<ApplicantProfile>(db.applicantProfiles).map(mapApplicantRow),
    jobPosts: normalizeArray<JobPost>(db.jobPosts).map(mapJobPostRow),
    applications: normalizeArray<ApplicationRecord>(db.applications).map(mapApplicationRow),
    interviews: normalizeArray<InterviewRecord>(db.interviews).map(mapInterviewRow),
    verifications: normalizeArray<VerificationRecord>(db.verifications).map(mapVerificationRow),
    reports: normalizeArray<ReportRecord>(db.reports).map(mapReportRow),
    alerts: normalizeArray<AlertRecord>(db.alerts).map(mapAlertRow),
    auditLogs: normalizeArray<AuditLogRecord>(db.auditLogs).map(mapAuditLogRow),
    services: normalizeArray<ServiceRecord>(db.services).map(mapServiceRow),
  };
}

export function toDbUser(user: UserRecord) {
  return {
    id: user.id,
    role: user.role,
    fullName: user.fullName,
    email: user.email,
    phone: user.phone,
    status: user.status,
    createdAt: user.createdAt,
  };
}

export function toDbEmployer(profile: EmployerProfile) {
  return {
    id: profile.id,
    userId: profile.userId,
    companyName: profile.companyName,
    contactPerson: profile.contactPerson,
    headline: profile.headline,
    location: profile.location,
    verified: profile.verified,
    businessType: profile.businessType,
  };
}

export function toDbApplicant(profile: ApplicantProfile) {
  return {
    id: profile.id,
    userId: profile.userId,
    fullName: profile.fullName,
    preferredName: profile.preferredName,
    email: profile.email,
    phone: profile.phone,
    barangay: profile.barangay,
    address: profile.address,
    headline: profile.headline,
    bio: profile.bio,
    skills: profile.skills,
    documentsReady: profile.documentsReady,
  };
}

export function toDbJobPost(post: JobPost) {
  return {
    id: post.id,
    employerId: post.employerId,
    title: post.title,
    position: post.position,
    postType: post.postType,
    createdAt: post.createdAt,
    status: post.status as any,
    qualifications: post.qualifications,
    requirements: post.requirements,
    description: post.description,
    employmentType: post.employmentType,
    schedule: post.schedule,
    salary: post.salary,
    urgency: post.urgency,
    benefits: post.benefits,
    employerRequirements: post.employerRequirements,
    adminRequirements: post.adminRequirements,
  };
}

export function toDbApplication(application: ApplicationRecord) {
  return {
    id: application.id,
    jobPostId: application.jobPostId,
    applicantId: application.applicantId,
    fullName: application.fullName,
    email: application.email,
    contact: application.contact,
    position: application.position,
    appliedDate: application.appliedDate,
    status: application.status,
    availability: application.availability,
    shiftPreference: application.shiftPreference,
    introduction: application.introduction,
    documents: application.documents,
  };
}

export function toDbInterview(interview: InterviewRecord) {
  return {
    id: interview.id,
    applicationId: interview.applicationId,
    applicantName: interview.applicantName,
    position: interview.position,
    contact: interview.contact,
    interviewDate: normalizeOptionalTimestamp(interview.interviewDate),
    interviewTime: interview.interviewTime,
    location: interview.location,
  };
}

export function toDbVerification(record: VerificationRecord) {
  const type =
    record.type === "Applicant Verification"
      ? "ApplicantVerification"
      : record.type === "Employer Verification"
      ? "EmployerVerification"
      : record.type;

  return {
    id: record.id,
    type: type as VerificationType,
    subjectName: record.subjectName,
    status: record.status,
    submittedAt: record.submittedAt,
    email: record.email,
    documents: record.documents,
    notes: record.notes,
    inviteToken: record.inviteToken,
    inviteSentAt: record.inviteSentAt,
    approvedAt: record.approvedAt,
    rejectedAt: record.rejectedAt,
  };
}

export function toDbReport(record: ReportRecord) {
  return {
    id: record.id,
    category: record.category,
    subject: record.subject,
    severity: record.severity,
    status: record.status,
    createdAt: record.createdAt,
  };
}

export function toDbAlert(record: AlertRecord) {
  return {
    id: record.id,
    description: record.description,
    level: record.level,
    status: record.status,
    createdAt: record.createdAt,
  };
}

export function toDbAuditLog(record: AuditLogRecord) {
  return {
    id: record.id,
    action: record.action,
    actor: record.actor,
    target: record.target,
    createdAt: record.createdAt,
  };
}

export function toDbService(record: ServiceRecord) {
  return {
    id: record.id,
    title: record.title,
    applications: record.applications,
    status: record.status,
  };
}

function toSupabaseUser(user: UserRecord) {
  return {
    id: user.id,
    role: user.role,
    full_name: user.fullName,
    email: user.email,
    phone: user.phone,
    status: user.status,
    created_at: user.createdAt,
  };
}

function toSupabaseEmployer(profile: EmployerProfile) {
  return {
    id: profile.id,
    user_id: profile.userId,
    company_name: profile.companyName,
    contact_person: profile.contactPerson,
    headline: profile.headline,
    location: profile.location,
    verified: profile.verified,
    business_type: profile.businessType,
  };
}

function toSupabaseApplicant(profile: ApplicantProfile) {
  return {
    id: profile.id,
    user_id: profile.userId,
    full_name: profile.fullName,
    preferred_name: profile.preferredName,
    email: profile.email,
    phone: profile.phone,
    barangay: profile.barangay,
    address: profile.address,
    headline: profile.headline,
    bio: profile.bio,
    skills: profile.skills,
    documents_ready: profile.documentsReady,
  };
}

function toSupabaseJobPost(post: JobPost) {
  return {
    id: post.id,
    employer_id: post.employerId,
    title: post.title,
    position: post.position,
    post_type: post.postType,
    created_at: post.createdAt,
    status: post.status,
    qualifications: post.qualifications,
    requirements: post.requirements,
    description: post.description,
    employment_type: post.employmentType,
    schedule: post.schedule,
    salary: post.salary,
    urgency: post.urgency,
    benefits: post.benefits,
    employer_requirements: post.employerRequirements,
    admin_requirements: post.adminRequirements,
    rejection_notes: post.rejectionNotes ?? null,
    published_at: post.publishedAt ?? null,
  };
}

function toSupabaseApplication(application: ApplicationRecord) {
  return {
    id: application.id,
    job_post_id: application.jobPostId,
    applicant_id: application.applicantId,
    full_name: application.fullName,
    email: application.email,
    contact: application.contact,
    position: application.position,
    applied_date: application.appliedDate,
    status: application.status,
    availability: application.availability,
    shift_preference: application.shiftPreference,
    introduction: application.introduction,
    documents: application.documents,
  };
}

function toSupabaseInterview(interview: InterviewRecord) {
  return {
    id: interview.id,
    application_id: interview.applicationId,
    applicant_name: interview.applicantName,
    position: interview.position,
    contact: interview.contact,
    interview_date: interview.interviewDate,
    interview_time: interview.interviewTime,
    location: interview.location,
  };
}

function toSupabaseVerification(record: VerificationRecord) {
  return {
    id: record.id,
    type: record.type,
    subject_name: record.subjectName,
    status: record.status,
    submitted_at: record.submittedAt,
    email: record.email,
    documents: record.documents,
    notes: record.notes,
    invite_token: record.inviteToken,
    invite_sent_at: record.inviteSentAt,
    approved_at: record.approvedAt,
    rejected_at: record.rejectedAt,
  };
}

function toSupabaseReport(record: ReportRecord) {
  return {
    id: record.id,
    category: record.category,
    subject: record.subject,
    severity: record.severity,
    status: record.status,
    created_at: record.createdAt,
  };
}

function toSupabaseAlert(record: AlertRecord) {
  return {
    id: record.id,
    description: record.description,
    level: record.level,
    status: record.status,
    created_at: record.createdAt,
  };
}

function toSupabaseAuditLog(record: AuditLogRecord) {
  return {
    id: record.id,
    action: record.action,
    actor: record.actor,
    target: record.target,
    created_at: record.createdAt,
  };
}

async function deleteAllData() {
  await prisma.service.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.report.deleteMany();
  await prisma.verification.deleteMany();
  await prisma.interview.deleteMany();
  await prisma.application.deleteMany();
  await prisma.jobPost.deleteMany();
  await prisma.applicantProfile.deleteMany();
  await prisma.employerProfile.deleteMany();
  await prisma.user.deleteMany();
}

export async function readDatabase(): Promise<PortalDatabase> {
  // In production we must ensure reads and writes use the same backend.
  // If Supabase is configured, prefer it over Prisma even if DATABASE_URL exists.
  const useSupabaseStore = Boolean(supabaseAdmin);
  const usePrisma = !useSupabaseStore && Boolean(process.env.DATABASE_URL);

  if (useSupabaseStore && supabaseAdmin) {
    try {
      const [usersRes, employerProfilesRes, applicantProfilesRes, jobPostsRes, applicationsRes, interviewsRes, verificationsRes, reportsRes, alertsRes, auditLogsRes, servicesRes] = await Promise.all([
        supabaseAdmin?.from("users").select("*") ?? { data: [], error: null },
        supabaseAdmin?.from("employer_profiles").select("*") ?? { data: [], error: null },
        supabaseAdmin?.from("applicant_profiles").select("*") ?? { data: [], error: null },
        supabaseAdmin?.from("job_posts").select("*") ?? { data: [], error: null },
        supabaseAdmin?.from("applications").select("*") ?? { data: [], error: null },
        supabaseAdmin?.from("interviews").select("*") ?? { data: [], error: null },
        supabaseAdmin?.from("verifications").select("*") ?? { data: [], error: null },
        supabaseAdmin?.from("reports").select("*") ?? { data: [], error: null },
        supabaseAdmin?.from("alerts").select("*") ?? { data: [], error: null },
        supabaseAdmin?.from("audit_logs").select("*") ?? { data: [], error: null },
        supabaseAdmin?.from("services").select("*") ?? { data: [], error: null },
      ]);

      const errors = [
        usersRes.error,
        employerProfilesRes.error,
        applicantProfilesRes.error,
        jobPostsRes.error,
        applicationsRes.error,
        interviewsRes.error,
        verificationsRes.error,
        reportsRes.error,
        alertsRes.error,
        auditLogsRes.error,
        servicesRes.error,
      ].filter(Boolean);

      if (errors.length === 0 && usersRes.data && employerProfilesRes.data && applicantProfilesRes.data && jobPostsRes.data && applicationsRes.data && interviewsRes.data && verificationsRes.data && reportsRes.data && alertsRes.data && auditLogsRes.data && servicesRes.data) {
        return {
          users: usersRes.data.map(mapUserRow),
          employerProfiles: employerProfilesRes.data.map(mapEmployerRow),
          applicantProfiles: applicantProfilesRes.data.map(mapApplicantRow),
          jobPosts: jobPostsRes.data.map(mapJobPostRow),
          applications: applicationsRes.data.map(mapApplicationRow),
          interviews: interviewsRes.data.map(mapInterviewRow),
          verifications: verificationsRes.data.map(mapVerificationRow),
          reports: reportsRes.data.map(mapReportRow),
          alerts: alertsRes.data.map(mapAlertRow),
          auditLogs: auditLogsRes.data.map(mapAuditLogRow),
          services: servicesRes.data.map(mapServiceRow),
        };
      }

      console.error("Supabase fallback readDatabase had errors", errors);
  } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("Supabase fallback readDatabase error:", message);
    }
  }

  if (!usePrisma) {
    await ensureDbFile();
    const raw = await readFile(dbPath, "utf8");
    const parsed = JSON.parse(raw) as PortalDatabase;
    return normalizeDatabase(parsed);
  }

  const [users, employerProfiles, applicantProfiles, jobPosts, applications, interviews, verifications, reports, alerts, auditLogs, services] = await Promise.all([
    prisma.user.findMany(),
    prisma.employerProfile.findMany(),
    prisma.applicantProfile.findMany(),
    prisma.jobPost.findMany(),
    prisma.application.findMany(),
    prisma.interview.findMany(),
    prisma.verification.findMany(),
    prisma.report.findMany(),
    prisma.alert.findMany(),
    prisma.auditLog.findMany(),
    prisma.service.findMany(),
  ]);

  return {
    users: users.map(mapUserRow),
    employerProfiles: employerProfiles.map(mapEmployerRow),
    applicantProfiles: applicantProfiles.map(mapApplicantRow),
    jobPosts: jobPosts.map(mapJobPostRow),
    applications: applications.map(mapApplicationRow),
    interviews: interviews.map(mapInterviewRow),
    verifications: verifications.map(mapVerificationRow),
    reports: reports.map(mapReportRow),
    alerts: alerts.map(mapAlertRow),
    auditLogs: auditLogs.map(mapAuditLogRow),
    services: services.map(mapServiceRow),
  };
}

export async function writeDatabase(db: PortalDatabase, safeMode = true) {
  // Keep write path consistent with readDatabase(): prefer Supabase when configured.
  const useSupabaseStore = Boolean(supabaseAdmin);
  const usePrisma = !useSupabaseStore && Boolean(process.env.DATABASE_URL);

  if (useSupabaseStore && supabaseAdmin) {
    try {
      if (safeMode) {
        console.log('writeDatabase Supabase safe mode - upserting users/profiles/applications/audit_logs');

        if (db.users.length) {
          await supabaseAdmin.from('users').upsert(db.users.map(toSupabaseUser), { onConflict: 'email' });
        }

        if (db.employerProfiles.length) {
          await supabaseAdmin.from('employer_profiles').upsert(db.employerProfiles.map(toSupabaseEmployer), { onConflict: 'id' });
        }

        if (db.applicantProfiles.length) {
          await supabaseAdmin.from('applicant_profiles').upsert(db.applicantProfiles.map(toSupabaseApplicant), { onConflict: 'id' });
        }

        if (db.verifications.length) {
          await supabaseAdmin.from('verifications').upsert(db.verifications.map(toSupabaseVerification), { onConflict: 'id' });
        }

        if (db.jobPosts.length) {
          await supabaseAdmin.from('job_posts').upsert(db.jobPosts.map(toSupabaseJobPost), { onConflict: 'id' });
        }

        if (db.applications.length) {
          await supabaseAdmin.from('applications').upsert(db.applications.map(toSupabaseApplication), { onConflict: 'id' });
        }

        // CRITICAL: persist audit logs in Supabase safe mode, otherwise /admin/audit-logs shows empty.
        if (db.auditLogs.length) {
          await supabaseAdmin
            .from('audit_logs')
            .upsert(db.auditLogs.map(toSupabaseAuditLog), { onConflict: 'id' });
        }

        return;
      }

      console.log('writeDatabase Supabase full sync mode - deleting and inserting records');
      await supabaseAdmin.from('services').delete().neq('id', '');
      await supabaseAdmin.from('audit_logs').delete().neq('id', '');
      await supabaseAdmin.from('alerts').delete().neq('id', '');
      await supabaseAdmin.from('reports').delete().neq('id', '');
      await supabaseAdmin.from('verifications').delete().neq('id', '');
      await supabaseAdmin.from('interviews').delete().neq('id', '');
      await supabaseAdmin.from('applications').delete().neq('id', '');
      await supabaseAdmin.from('job_posts').delete().neq('id', '');
      await supabaseAdmin.from('applicant_profiles').delete().neq('id', '');
      await supabaseAdmin.from('employer_profiles').delete().neq('id', '');
      await supabaseAdmin.from('users').delete().neq('id', '');

      if (db.users.length) {
        await supabaseAdmin.from('users').insert(db.users.map(toSupabaseUser));
      }
      if (db.employerProfiles.length) {
        await supabaseAdmin.from('employer_profiles').insert(db.employerProfiles.map(toSupabaseEmployer));
      }
      if (db.applicantProfiles.length) {
        await supabaseAdmin.from('applicant_profiles').insert(db.applicantProfiles.map(toSupabaseApplicant));
      }
      if (db.jobPosts.length) {
        await supabaseAdmin.from('job_posts').insert(db.jobPosts.map(toSupabaseJobPost));
      }
      if (db.applications.length) {
        await supabaseAdmin.from('applications').insert(db.applications.map(toSupabaseApplication));
      }
      if (db.interviews.length) {
        await supabaseAdmin.from('interviews').insert(db.interviews.map(toSupabaseInterview));
      }
      if (db.verifications.length) {
        await supabaseAdmin.from('verifications').insert(db.verifications.map(toSupabaseVerification));
      }
      if (db.reports.length) {
        await supabaseAdmin.from('reports').insert(db.reports.map(toSupabaseReport));
      }
      if (db.alerts.length) {
        await supabaseAdmin.from('alerts').insert(db.alerts.map(toSupabaseAlert));
      }
      if (db.auditLogs.length) {
        await supabaseAdmin.from('audit_logs').insert(db.auditLogs.map(toSupabaseAuditLog));
      }
      if (db.services.length) {
        await supabaseAdmin.from('services').insert(db.services.map(toDbService));
      }

      return;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('writeDatabase Supabase error:', message);
      throw new Error(`Supabase write failed: ${message || 'Unknown error'}`);
    }
  }

  if (!usePrisma) {
    await ensureDbFile();
    await writeFile(dbPath, JSON.stringify(db, null, 2), "utf8");
    return;
  }

  try {
  if (safeMode) {
      // Safe mode: persist *all* core entities including audit logs
      // so admin/audit-logs reflects actions immediately.
      console.log('writeDatabase: Safe mode - upserting users/profiles/job_posts/applications/audit_logs');
      
      for (const user of db.users) {
        await prisma.user.upsert({
          where: { email: user.email },
          update: {
            role: user.role,
            fullName: user.fullName,
            phone: user.phone || "",
            status: user.status,
          },
          create: {
            id: user.id,
            role: user.role,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone || "",
            status: user.status,
            createdAt: user.createdAt,
          },
        });
      }

      for (const profile of db.employerProfiles) {
        await prisma.employerProfile.upsert({
          where: { id: profile.id },
          update: {
            userId: profile.userId,
            companyName: profile.companyName,
            contactPerson: profile.contactPerson,
            headline: profile.headline || null,
            location: profile.location || null,
            verified: profile.verified,
            businessType: profile.businessType || null,
          },
          create: {
            id: profile.id,
            userId: profile.userId,
            companyName: profile.companyName,
            contactPerson: profile.contactPerson,
            headline: profile.headline || null,
            location: profile.location || null,
            verified: profile.verified,
            businessType: profile.businessType || null,
          },
        });
      }

      for (const profile of db.applicantProfiles) {
        await prisma.applicantProfile.upsert({
          where: { id: profile.id },
          update: {
            userId: profile.userId,
            fullName: profile.fullName,
            preferredName: profile.preferredName || "",
            email: profile.email,
            phone: profile.phone || "",
            barangay: profile.barangay || "",
            address: profile.address || "",
            headline: profile.headline || "",
            bio: profile.bio || "",
            skills: profile.skills as any,
            documentsReady: profile.documentsReady as any,
          },
          create: {
            id: profile.id,
            userId: profile.userId,
            fullName: profile.fullName,
            preferredName: profile.preferredName || "",
            email: profile.email,
            phone: profile.phone || "",
            barangay: profile.barangay || "",
            address: profile.address || "",
            headline: profile.headline || "",
            bio: profile.bio || "",
            skills: profile.skills as any,
            documentsReady: profile.documentsReady as any,
          },
        });
      }

      // Safe mode: Persist audit logs first so the admin Audit Logs page stays in sync
      for (const log of db.auditLogs) {
        await prisma.auditLog.upsert({
          where: { id: log.id },
          update: {
            action: log.action,
            actor: log.actor,
            target: log.target,
            createdAt: new Date(log.createdAt),
          },
          create: {
            id: log.id,
            action: log.action,
            actor: log.actor,
            target: log.target,
            createdAt: new Date(log.createdAt),
          },
        });
      }

      // Safe mode: Also handle job_posts, applications for employer flow
      for (const post of db.jobPosts) {
        await prisma.jobPost.upsert({
          where: { id: post.id },
          update: {
            employerId: post.employerId,
            title: post.title,
            position: post.position,
            postType: post.postType,
            status: post.status as unknown as any,
            qualifications: post.qualifications || null,
            requirements: post.requirements || null,
            description: post.description || null,
            employmentType: post.employmentType || null,
            schedule: post.schedule || null,
            salary: post.salary || null,
            urgency: post.urgency || null,
            benefits: post.benefits as any,
            employerRequirements: post.employerRequirements as any,
            adminRequirements: post.adminRequirements as any,
          },
          create: {
            id: post.id,
            employerId: post.employerId,
            title: post.title,
            position: post.position,
            postType: post.postType,
            status: post.status as unknown as any,
            createdAt: post.createdAt,
            qualifications: post.qualifications || null,
            requirements: post.requirements || null,
            description: post.description || null,
            employmentType: post.employmentType || null,
            schedule: post.schedule || null,
            salary: post.salary || null,
            urgency: post.urgency || null,
            benefits: post.benefits as any,
            employerRequirements: post.employerRequirements as any,
            adminRequirements: post.adminRequirements as any,
          },
        });
      }

      for (const application of db.applications) {
        await prisma.application.upsert({
          where: { id: application.id },
          update: {
            jobPostId: application.jobPostId,
            applicantId: application.applicantId || "",
            fullName: application.fullName,
            email: application.email,
            contact: application.contact || "",
            position: application.position,
            appliedDate: application.appliedDate,
            status: application.status,
            availability: application.availability || "",
            shiftPreference: application.shiftPreference || "",
            introduction: application.introduction || "",
            documents: application.documents as any,
          },
          create: {
            id: application.id,
            jobPostId: application.jobPostId,
            applicantId: application.applicantId || "",
            fullName: application.fullName,
            email: application.email,
            contact: application.contact || "",
            position: application.position,
            appliedDate: application.appliedDate,
            status: application.status,
            availability: application.availability || "",
            shiftPreference: application.shiftPreference || "",
            introduction: application.introduction || "",
            documents: application.documents as any,
          },
        });
      }
    }

    // Full sync mode (production)
await prisma.$transaction(async (prismaTx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => {
      await prismaTx.service.deleteMany();
      await prismaTx.auditLog.deleteMany();
      await prismaTx.alert.deleteMany();
      await prismaTx.report.deleteMany();
      await prismaTx.verification.deleteMany();
      await prismaTx.interview.deleteMany();
      await prismaTx.application.deleteMany();
      await prismaTx.jobPost.deleteMany();
      await prismaTx.applicantProfile.deleteMany();
      await prismaTx.employerProfile.deleteMany();
      await prismaTx.user.deleteMany();

      await prismaTx.user.createMany({ data: db.users.map(toDbUser) });
      await prismaTx.employerProfile.createMany({ data: db.employerProfiles.map(toDbEmployer) });
      await prismaTx.applicantProfile.createMany({ data: db.applicantProfiles.map(toDbApplicant) });
      await prismaTx.jobPost.createMany({ data: db.jobPosts.map(toDbJobPost) });
      await prismaTx.application.createMany({ data: db.applications.map(toDbApplication) });
      await prismaTx.interview.createMany({ data: db.interviews.map(toDbInterview) });
      await prismaTx.verification.createMany({ data: db.verifications.map(toDbVerification) });
      await prismaTx.report.createMany({ data: db.reports.map(toDbReport) });
      await prismaTx.alert.createMany({ data: db.alerts.map(toDbAlert) });
      await prismaTx.auditLog.createMany({ data: db.auditLogs.map(toDbAuditLog) });
      await prismaTx.service.createMany({ data: db.services.map(toDbService) });
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('writeDatabase Prisma error:', message);
    throw new Error(`Prisma write failed: ${message || 'Unknown error'}`);
  }
}

export function makeId(prefix: string) {
  void prefix;
  return randomUUID();
}

export function getEmployerProfile(db: PortalDatabase, currentUserId?: string, currentUserEmail?: string): EmployerProfile | null {
  if (currentUserId) {
    const byId = db.employerProfiles.find((p) => p.userId === currentUserId);
    if (byId) return byId;
  }

  if (currentUserEmail) {
    const email = currentUserEmail.toLowerCase();
    const linkedUser = db.users.find((user) => user.email.toLowerCase() === email);
    if (linkedUser) {
      const byLinkedUserId = db.employerProfiles.find((profile) => profile.userId === linkedUser.id);
      if (byLinkedUserId) return byLinkedUserId;
    }
  }

  return db.employerProfiles[0] ?? null;
}

export async function getOrCreateEmployerProfile(db: PortalDatabase, userId: string, supabaseAdmin: unknown): Promise<EmployerProfile> {
  const profile = db.employerProfiles.find(p => p.userId === userId);
  if (profile) return profile;

  // Create new
  const newProfile: EmployerProfile = {
    id: makeId("employer"),
    userId,
    companyName: `New Employer Business`,
    contactPerson: "Contact Person",
    headline: "New employer account",
    location: "Barangay 634",
    verified: false,
    businessType: "General",
  };
  db.employerProfiles.unshift(newProfile);

  // Sync to Supabase
  if (supabaseAdmin) {
    try {
      console.log('getOrCreateEmployerProfile: upserting employer profile to Supabase for userId=', userId);
      const res = await (supabaseAdmin as { from: (table: string) => any })
        .from('employer_profiles')
        .upsert([toSupabaseEmployer(newProfile)])
        .select()
        .single();

      if (res?.error) {
        console.warn('getOrCreateEmployerProfile: Supabase upsert error:', res.error?.message || res.error);
      } else {
        console.log('getOrCreateEmployerProfile: Supabase upsert result:', res.data);
      }

      // Re-query to get canonical row (ensure user_id column populated)
      try {
        const check = await (supabaseAdmin as { from: (table: string) => any })
          .from('employer_profiles')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (check?.data) {
          // Map Supabase row to local EmployerProfile shape
          const row: any = check.data;
          return {
            id: row.id,
            userId: row.user_id,
            companyName: row.company_name ?? newProfile.companyName,
            contactPerson: row.contact_person ?? newProfile.contactPerson,
            headline: row.headline ?? newProfile.headline,
            location: row.location ?? newProfile.location,
            verified: row.verified ?? !!newProfile.verified,
            businessType: row.business_type ?? newProfile.businessType,
          } as EmployerProfile;
        }
      } catch (checkErr) {
        console.warn('getOrCreateEmployerProfile: Supabase verify query failed:', checkErr);
      }
    } catch (err) {
      console.warn('getOrCreateEmployerProfile: Supabase sync failed:', err);
    }
  }

  appendAuditLog(db, { actor: "System", action: "auto-created employer profile", target: userId });
  return newProfile;
}

export function getApplicantProfile(db: PortalDatabase, currentUserId?: string, currentUserEmail?: string) {
  if (currentUserId) {
    const byId = db.applicantProfiles.find((p) => p.userId === currentUserId);
    if (byId) return byId;
  }

  if (currentUserEmail) {
    const email = currentUserEmail.toLowerCase();

    const linkedUser = db.users.find((user) => user.email.toLowerCase() === email);
    if (linkedUser) {
      const byLinkedUserId = db.applicantProfiles.find((profile) => profile.userId === linkedUser.id);
      if (byLinkedUserId) return byLinkedUserId;
    }

    const byEmail = db.applicantProfiles.find((profile) => (profile.email ?? '').toLowerCase() === email);
    if (byEmail) return byEmail;
  }

  return db.applicantProfiles[0] ?? null;
}


// Deprecated - use getApplicantProfile(db, userId)
export function getApplicantProfileByUserId(db: PortalDatabase, userId: string) {
  return db.applicantProfiles.find((item) => item.userId === userId) ?? null;
}

export function withDerivedData(db: PortalDatabase, currentUser: UserRecord | null = null) {
  const employer = getEmployerProfile(db, currentUser?.id, currentUser?.email);
  const applicantProfile =
    currentUser?.role === "applicant"
      ? getApplicantProfile(db, currentUser.id, currentUser.email)
      : getApplicantProfile(db);
  const currentApplicantProfile = applicantProfile;


  // Filter job posts for current employer
  let jobPostsBase = db.jobPosts;
  if (currentUser?.role === "employer" && employer) {
    jobPostsBase = db.jobPosts.filter(post => post.employerId === employer.id);
  }

  // Applicants should only be able to see admin-verified (approved) job posts.
  // Admin verification workflow uses `status` (e.g. pending/closed/rejected -> not visible to applicants).
  if (currentUser?.role === "applicant") {
    jobPostsBase = jobPostsBase.filter((post) => post.status === "active");
  }

  const jobPosts = jobPostsBase.map((post) => {
      const postEmployer = db.employerProfiles.find((profile) => profile.id === post.employerId) ?? employer;
      const applicantCount = db.applications.filter((application) => application.jobPostId === post.id && application.status !== "rejected").length;
      return {
        ...post,
        applicantCount,
        viewCount: applicantCount * 7 + 18,
        companyName: postEmployer?.companyName ?? "Barangay Employer",
        contactPerson: postEmployer?.contactPerson ?? "Employer Contact",
        location: postEmployer?.location ?? "Barangay 634",
      };
    })
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));

  const scopedApplicationsBase =
    currentUser?.role === "employer"
      ? db.applications.filter((application) => jobPosts.some((post) => post.id === application.jobPostId))
      : db.applications;

  const applications = scopedApplicationsBase
    .map((application) => {
      const post = jobPosts.find((job) => job.id === application.jobPostId);
      const interview = db.interviews.find((i) => i.applicationId === application.id);
      return {
        ...application,
        employerName: post?.companyName ?? "Barangay Employer",
        title: post?.title ?? application.position,
        location: post?.location ?? "Barangay 634",
        interviewDate: interview?.interviewDate ?? null,
        interviewTime: interview?.interviewTime ?? null,
        interviewLocation: interview?.location ?? null,
      };
    })
    .sort((a, b) => +new Date(b.appliedDate) - +new Date(a.appliedDate));

  const hiredApplicants = applications
    .filter((application) => application.status === "hired")
    .map((application) => ({ ...application, hiredDate: application.appliedDate }));

  const interviews = db.interviews
    .filter((interview) =>
      currentUser?.role === "employer"
        ? applications.some((application) => application.id === interview.applicationId)
        : true,
    )
    .map((interview) => {
      const application = applications.find((item) => item.id === interview.applicationId);
      const post = application ? jobPosts.find((job) => job.id === application.jobPostId) : null;

      return {
        ...interview,
        applicantEmail: application?.email ?? "",
        applicantDocuments: application?.documents ?? [],
        jobTitle: post?.title ?? application?.position ?? interview.position,
        employerName: post?.companyName ?? "Barangay Employer",
        location: interview.location || "Barangay 634 Hall",
      };
    });

  const postPerformance = jobPosts.map((post) => ({
    id: post.id,
    position: post.position,
    applicantCount: post.applicantCount,
  }));

  const recentApplicants = applications.slice(0, 5);

  const summary = {
    activePosts: jobPosts.filter((post) => post.status === "active").length,
    totalApplicants: applications.length,
    pendingReview: applications.filter((application) => application.status === "pending" || application.status === "reviewing").length,
    forInterview: interviews.length,
    hired: hiredApplicants.length,
  };

  const applicantApplications = currentApplicantProfile
    ? applications.filter((application) => application.applicantId === currentApplicantProfile.id)
    : [];

  const availableSwipeJobs = currentApplicantProfile
    ? jobPosts
        .filter((post) => post.status === "active")
        .map((post) => ({
          ...post,
          alreadyApplied: applicantApplications.some((application) => application.jobPostId === post.id),
        }))
    : jobPosts;

  const adminSummary = {
    pendingVerifications: db.verifications.filter((item) => item.status === "pending").length,
    activeJobs: jobPosts.filter((item) => item.status === "active").length,
    securityAlerts: db.alerts.filter((item) => item.status !== "resolved").length,
    totalApplications: applications.length,
    verifiedEmployers: db.employerProfiles.filter((item) => item.verified).length,
  };

  const allUsers = db.users.map((user) => ({
    ...user,
    applications:
      user.role === "applicant"
        ? applications.filter((application) => application.email === user.email).length
        : undefined,
  }));

  const employers = db.employerProfiles.map((profile) => ({
    ...profile,
    userStatus: db.users.find((user) => user.id === profile.userId)?.status ?? "pending",
    count_applications: applications.filter((application) => {
      const post = jobPosts.find((job) => job.id === application.jobPostId);
      return post?.employerId === profile.id;
    }).length,
  }));

  const recentActivity = [
    ...db.auditLogs.slice(0, 4).map((item) => ({
      id: item.id,
      description: `${item.actor} ${item.action.toLowerCase()} for ${item.target}`,
      timeAgo: new Date(item.createdAt).toLocaleString(),
    })),
  ];

  return {
    employerProfile: employer,
    applicantProfile,
    applicantProfiles: db.applicantProfiles,
    jobPosts,
    applications,
    hiredApplicants,
    interviews,
    postPerformance,
    recentApplicants,
    summary,
    applicantApplications,
    availableSwipeJobs,
    adminSummary,
    verifications: db.verifications,
    reports: db.reports,
    alerts: db.alerts,
    auditLogs: db.auditLogs,
    services: db.services,
    allUsers,
    employers,
    recentActivity,
  };
}

export function appendAuditLog(db: PortalDatabase, entry: Omit<AuditLogRecord, "id" | "createdAt">) {
  db.auditLogs.unshift({
    id: makeId("audit"),
    createdAt: new Date().toISOString(),
    ...entry,
  });
}

export function setApplicationStatus(
  db: PortalDatabase,
  applicationId: string,
  status: ApplicationRecord["status"],
  interviewDetails?: Partial<Pick<InterviewRecord, "interviewDate" | "interviewTime" | "location">>
) {
  const application = db.applications.find((item) => item.id === applicationId);
  if (!application) return null;

  application.status = status;

  if (status === "for_interview") {
    const existingInterview = db.interviews.find((item) => item.applicationId === applicationId);
    const nextInterviewDate = interviewDetails?.interviewDate ?? new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);
    const nextInterviewTime = interviewDetails?.interviewTime ?? "1:30 PM";
    const nextInterviewLocation = interviewDetails?.location ?? "Barangay 634 Hall";

    if (existingInterview) {
      existingInterview.applicantName = application.fullName;
      existingInterview.position = application.position;
      existingInterview.contact = application.contact;
      existingInterview.interviewDate = nextInterviewDate;
      existingInterview.interviewTime = nextInterviewTime;
      existingInterview.location = nextInterviewLocation;
    } else {
      db.interviews.unshift({
        id: makeId("interview"),
        applicationId,
        applicantName: application.fullName,
        position: application.position,
        contact: application.contact,
        interviewDate: nextInterviewDate,
        interviewTime: nextInterviewTime,
        location: nextInterviewLocation,
      });
    }
  }

  if (status === "hired" || status === "rejected") {
    db.interviews = db.interviews.filter((item) => item.applicationId !== applicationId);
  }

  appendAuditLog(db, {
    actor: "Employer",
    action: `updated applicant status to ${status}`,
    target: application.fullName,
  });

  return application;
}

export function createJobPost(
  db: PortalDatabase,
  employerId: string,
  input: Omit<JobPost, "id" | "createdAt" | "employerId">
) {
  const employer = db.employerProfiles.find((profile) => profile.id === employerId) ?? getEmployerProfile(db);
  const post: JobPost = {
    id: makeId("job"),
    createdAt: new Date().toISOString(),
    employerId,
    ...input,
    status: input.status ?? "pending",
    employmentType: input.employmentType ?? "Full-time",
    schedule: input.schedule ?? "Flexible",
    salary: input.salary ?? "Competitive",
    urgency: input.urgency ?? "Normal",
    benefits: input.benefits ?? ["Community-based employment", "Local support"],
    employerRequirements: input.employerRequirements ?? ["Resume", "Barangay clearance"],
    adminRequirements: input.adminRequirements ?? ["Valid ID", "Proof of address"],
    requirements: input.requirements ?? (input.adminRequirements ? input.adminRequirements.join(", ") : ""),
  };
  db.jobPosts.unshift(post);
  db.verifications.unshift({
    id: makeId("verification"),
    type: "Employer Verification",
    subjectName: `Job Post: ${post.title}`,
    status: "pending",
    submittedAt: new Date().toISOString(),
  });
  appendAuditLog(db, { actor: employer?.contactPerson ?? "Employer", action: "created job post", target: post.title });
  return post;
}

export function createApplication(
  db: PortalDatabase,
  input: Omit<ApplicationRecord, "id" | "appliedDate" | "status" | "position"> & { jobPostId: string }
) {
  const post = db.jobPosts.find((item) => item.id === input.jobPostId && item.status === "active");
  if (!post) return null;

  const application: ApplicationRecord = {
    id: makeId("application"),
    appliedDate: new Date().toISOString(),
    status: "pending",
    position: post.position,
    ...input,
  };

  db.applications.unshift(application);
  appendAuditLog(db, { actor: application.fullName, action: "submitted application", target: post.title });
  return application;
}

export function updateApplication(
  db: PortalDatabase,
  applicationId: string,
  payload: Partial<Pick<ApplicationRecord, "fullName" | "email" | "contact" | "availability" | "shiftPreference" | "introduction" | "documents">>
) {
  const application = db.applications.find((item) => item.id === applicationId);
  if (!application) return null;

  Object.assign(application, payload);
  appendAuditLog(db, { actor: application.fullName, action: "updated application", target: application.position });
  return application;
}

export function updateInterview(
  db: PortalDatabase,
  interviewId: string,
  payload: Pick<InterviewRecord, "interviewDate" | "interviewTime" | "location">
) {
  const interview = db.interviews.find((item) => item.id === interviewId);
  if (!interview) return null;
  interview.interviewDate = payload.interviewDate;
  interview.interviewTime = payload.interviewTime;
  interview.location = payload.location;
  appendAuditLog(db, { actor: "Employer", action: "rescheduled interview", target: interview.applicantName });
  return interview;
}

export function updateApplicantProfile(db: PortalDatabase, payload: Partial<PortalDatabase["applicantProfiles"][number]>) {
  const profile = getApplicantProfile(db);
  if (!profile) return null;
  Object.assign(profile, payload);
  appendAuditLog(db, { actor: profile.fullName, action: "updated applicant profile", target: profile.fullName });
  return profile;
}

export function updateApplicantProfileByUserId(
  db: PortalDatabase,
  userId: string,
  payload: Partial<PortalDatabase["applicantProfiles"][number]>
) {
  const profile = getApplicantProfileByUserId(db, userId);
  if (!profile) return null;
  Object.assign(profile, payload);
  appendAuditLog(db, { actor: profile.fullName, action: "updated applicant profile", target: profile.fullName });
  return profile;
}

export async function updateVerification(db: PortalDatabase, verificationId: string, status: VerificationRecord["status"]) {
  const item = db.verifications.find((record) => record.id === verificationId);
  if (!item) return null;
  item.status = status;

  const isApplicantVerification = item.type === "Applicant Verification";

  if (isApplicantVerification) {
    if (status === "approved") {
      item.approvedAt = new Date().toISOString();
      if (!item.inviteToken) {
        item.inviteToken = makeId("invite");
      }
    } else if (status === "rejected") {
      item.rejectedAt = new Date().toISOString();
    }
  }

  const normalizedEmail = item.email?.toLowerCase() ?? "";
  const linkedUser = db.users.find(
    (entry) =>
      (normalizedEmail && entry.email.toLowerCase() === normalizedEmail) ||
      entry.fullName === item.subjectName
  );

  if (linkedUser && linkedUser.role !== "admin") {
    const newStatus = status === "approved" ? "verified" : status === "rejected" ? "suspended" : "pending";
    linkedUser.status = newStatus;

    let updatedInPrisma = false;
    if (process.env.DATABASE_URL) {
      try {
        await prisma.user.update({
          where: { email: linkedUser.email },
          data: { status: newStatus },
        });
        updatedInPrisma = true;
      } catch (error) {
        console.error(`Failed to update user status in Prisma for ${linkedUser.email}:`, error);
      }
    }

    if (!updatedInPrisma && supabaseAdmin) {
      const { error: updateError } = await supabaseAdmin
        .from('users')
        .update({ status: newStatus })
        .eq('email', linkedUser.email);
      if (updateError) {
        console.error(`Failed to update user status in Supabase for ${linkedUser.email}:`, updateError);
      }
    }
  }

  const employer = db.employerProfiles.find(
    (profile) =>
      profile.companyName === item.subjectName ||
      profile.contactPerson === item.subjectName ||
      (linkedUser ? profile.userId === linkedUser.id : false)
  );

  if (employer) {
    employer.verified = status === "approved";

    let employerUpdatedInPrisma = false;
    if (process.env.DATABASE_URL && linkedUser) {
      try {
        await prisma.employerProfile.update({
          where: { userId: linkedUser.id },
          data: { verified: status === "approved" },
        });
        employerUpdatedInPrisma = true;
      } catch (error) {
        console.error(`Failed to update employer profile in Prisma for ${linkedUser.id}:`, error);
      }
    }

    if (!employerUpdatedInPrisma && supabaseAdmin && linkedUser) {
      const { error: employerError } = await supabaseAdmin
        .from('employer_profiles')
        .update({ verified: status === 'approved' })
        .eq('user_id', linkedUser.id);
      if (employerError) {
        console.error(`Failed to update employer profile in Supabase for ${linkedUser.id}:`, employerError);
      }
    }
  }

  let verificationUpdatedInPrisma = false;
  if (process.env.DATABASE_URL) {
    try {
      await prisma.verification.update({
        where: { id: item.id },
        data: {
          status,
          approvedAt: item.approvedAt ? new Date(item.approvedAt) : null,
          rejectedAt: item.rejectedAt ? new Date(item.rejectedAt) : null,
          inviteToken: item.inviteToken ?? null,
          inviteSentAt: item.inviteSentAt ? new Date(item.inviteSentAt) : null,
        },
      });
      verificationUpdatedInPrisma = true;
    } catch (error) {
      console.error(`Failed to update verification in Prisma for ${item.id}:`, error);
    }
  }

  if (!verificationUpdatedInPrisma && supabaseAdmin) {
    const { error: verificationError } = await supabaseAdmin
      .from('verifications')
      .update({
        status,
        approved_at: item.approvedAt ?? null,
        rejected_at: item.rejectedAt ?? null,
        invite_token: item.inviteToken ?? null,
        invite_sent_at: item.inviteSentAt ?? null,
      })
      .eq('id', item.id);
    if (verificationError) {
      console.error(`Failed to update verification in Supabase for ${item.id}:`, verificationError);
    }
  }

  appendAuditLog(db, { actor: "Barangay Admin", action: `marked verification ${status}`, target: item.subjectName });
  return item;
}

export function sendVerificationInvite(db: PortalDatabase, verificationId: string) {
  const item = db.verifications.find((record) => record.id === verificationId);
  if (!item || item.status !== "approved") return null;
  if (!item.inviteToken) {
    item.inviteToken = makeId("invite");
  }
  item.inviteSentAt = new Date().toISOString();
  appendAuditLog(db, { actor: "Barangay Admin", action: "sent applicant invite", target: item.subjectName });
  return item;
}

export function createApplicantVerification(db: PortalDatabase, input: {
  fullName: string;
  email: string;
  phone?: string;
  address: string;
  barangay: string;
  documents: string[];
  notes?: string;
}) {
  const verification: VerificationRecord = {
    id: makeId("verification"),
    type: "Applicant Verification",
    subjectName: input.fullName,
    email: input.email,
    documents: input.documents,
    notes: input.notes,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };
  db.verifications.unshift(verification);
  appendAuditLog(db, { actor: input.fullName, action: "submitted applicant verification", target: input.email });
  return verification;
}

export function createEmployerVerification(db: PortalDatabase, input: {
  fullName: string;
  email: string;
  phone?: string;
  address: string;
  barangay: string;
  documents: string[];
  notes?: string;
}) {
  const verification: VerificationRecord = {
    id: makeId("verification"),
    type: "Employer Verification",
    subjectName: input.fullName,
    email: input.email,
    documents: input.documents,
    notes:
      input.notes ??
      `${input.phone ? `Phone: ${input.phone}\n` : ""}Address: ${input.address}\nBarangay: ${input.barangay}`,
    status: "pending",
    submittedAt: new Date().toISOString(),
  };
  db.verifications.unshift(verification);
  appendAuditLog(db, { actor: input.fullName, action: "submitted employer verification", target: input.email });
  return verification;
}

export function updateJobPostStatus(db: PortalDatabase, jobPostId: string, status: JobPostStatus) {
  // Runtime guard: Prisma jobPost.status enum may not include "rejected".
  // We keep in-memory `db.jobPosts` consistent for applicant filtering.
  // If the DB layer can't persist it, applicant visibility would still break.
  // To avoid build failures, we coerce the value to Prisma's expected type at the DB sync boundary.

  const item = db.jobPosts.find((record) => record.id === jobPostId);
  if (!item) return null;
  item.status = status as unknown as JobPostStatus;
  if (status === "active") {
    item.publishedAt = new Date().toISOString();
  } else {
    item.publishedAt = null;
  }

  // Clear any previous rejection notes when updating status (except when explicitly rejected)
  if (status === "rejected") {
    // keep existing notes if present (can be overwritten by *_WithNotes)
    item.rejectionNotes = item.rejectionNotes ?? "";
  } else {
    item.rejectionNotes = "";
  }

  appendAuditLog(db, { actor: "Barangay Admin", action: `updated job post ${status}`, target: item.title });
  return item;
}

export function updateJobPostStatusWithNotes(
  db: PortalDatabase,
  jobPostId: string,
  status: JobPostStatus,
  rejectionNotes: string
) {
  // Cast because Prisma's enum type may not yet include "rejected" in the current schema.
  // This keeps applicant filtering logic consistent in-memory.

  const item = db.jobPosts.find((record) => record.id === jobPostId);
  if (!item) return null;

  item.status = status as unknown as JobPostStatus;

  const trimmed = (rejectionNotes ?? "").trim();
  const notesSummary = trimmed.length ? trimmed : "(no notes provided)";

  // store the notes on the in-memory post for UI
  item.rejectionNotes = trimmed.length ? trimmed : "";
  if (status !== "rejected") {
    // clear rejection notes when not rejected
    item.rejectionNotes = "";
  }

  if (status === "active") {
    item.publishedAt = new Date().toISOString();
  } else if (status === "closed" || status === "rejected") {
    item.publishedAt = null;
  }

  appendAuditLog(db, {
    actor: "Barangay Admin",
    action: status === "closed" ? `rejected job post (notes: ${notesSummary})` : `updated job post ${status} (notes: ${notesSummary})`,
    target: item.title,
  });

  return item;
}


export function updateReport(db: PortalDatabase, reportId: string, status: ReportRecord["status"]) {
  const item = db.reports.find((record) => record.id === reportId);
  if (!item) return null;
  item.status = status;
  appendAuditLog(db, { actor: "Barangay Admin", action: `updated report ${status}`, target: item.subject });
  return item;
}

export function updateAlert(db: PortalDatabase, alertId: string, status: AlertRecord["status"]) {
  const item = db.alerts.find((record) => record.id === alertId);
  if (!item) return null;
  item.status = status;
  appendAuditLog(db, { actor: "Barangay Admin", action: `updated alert ${status}`, target: item.description });
  return item;
}

export function updateService(db: PortalDatabase, serviceId: string, status: ServiceRecord["status"]) {
  const item = db.services.find((record) => record.id === serviceId);
  if (!item) return null;
  item.status = status;
  appendAuditLog(db, { actor: "Barangay Admin", action: `updated service ${status}`, target: item.title });
  return item;
}

export async function upsertPortalUser(
  db: PortalDatabase,
  payload: Pick<UserRecord, "fullName" | "email"> & { role: UserRecord["role"]; phone?: string },
  options?: { inviteToken?: string | null; invitedEmail?: string | null },
  supabaseAdmin?: any
) {

  const normalizedEmail = payload.email.toLowerCase();
  const existing = db.users.find((entry) => entry.email.toLowerCase() === normalizedEmail);

  const approvedVerification = db.verifications.find(
    (entry) =>
      entry.type === "Applicant Verification" &&
      entry.email?.toLowerCase() === normalizedEmail &&
      entry.status === "approved" &&
      (!options?.inviteToken || entry.inviteToken === options.inviteToken)
  );


  if (existing) {
    existing.role = payload.role;
    existing.fullName = payload.fullName;
    if (payload.phone) existing.phone = payload.phone;
    if (existing.status === "pending") {
      existing.status = payload.role === "admin" ? "verified" : approvedVerification ? "verified" : "pending";
    }
    return existing;
  }

  const user: UserRecord = {
    id: makeId("user"),
    role: payload.role,
    fullName: payload.fullName,
    email: payload.email,
    phone: payload.phone ?? "",
    status: payload.role === "admin" ? "verified" : approvedVerification ? "verified" : "pending",
    createdAt: new Date().toISOString(),
  };

  db.users.unshift(user);

  if (payload.role === "applicant") {
    // Ensure we don't create duplicate applicant profiles for the same user.
    if (!db.applicantProfiles.some((p) => p.userId === user.id)) {
      db.applicantProfiles.unshift({
        id: makeId("applicant"),
        userId: user.id,
        fullName: payload.fullName,
        preferredName: payload.fullName.split(" ")[0] ?? payload.fullName,
        email: payload.email,
        phone: payload.phone ?? "",
        barangay: "Barangay 634",
        address: "",
        headline: "New applicant account",
        bio: "",
        skills: [],
        documentsReady: [],
      });
    }

    // Prevent duplicate pending verification records.
    const email = payload.email.toLowerCase();
    const subjectName = payload.fullName;

    const hasExistingApplicantVerification = db.verifications.some((entry) => {
      if (entry.type !== "Applicant Verification") return false;
      if (entry.email) return entry.email.toLowerCase() === email;
      return entry.subjectName === subjectName;
    });

    if (!hasExistingApplicantVerification) {
      db.verifications.unshift({
        id: makeId("verification"),
        type: "Applicant Verification",
        subjectName,
        email: payload.email,
        status: "pending",
        submittedAt: new Date().toISOString(),
      });
    }
  } else if (payload.role === "employer") {
    const employerProfile = await getOrCreateEmployerProfile(db, user.id, supabaseAdmin ? supabaseAdmin : null);


    // Override with signup data
    employerProfile.companyName = `${payload.fullName}'s Business`;
    employerProfile.contactPerson = payload.fullName;
    employerProfile.headline = "New employer account";
    employerProfile.verified = true;
    employerProfile.businessType = "Pending business type";

    // Always create a pending employer verification so it appears in the Admin "Verifications Management" page.
    // Prevent duplicate pending employer verification records.
    const verificationSubject = `${payload.fullName}'s Business`;
    const normalizedEmail = payload.email.toLowerCase();

    const hasExistingEmployerVerification = db.verifications.some((entry) => {
      if (entry.type !== "Employer Verification") return false;
      if (entry.status !== "pending") return false;

      if (entry.email) {
        return entry.subjectName === verificationSubject && entry.email.toLowerCase() === normalizedEmail;
      }

      // Fallback: dedupe by subjectName when no email exists on the record.
      return entry.subjectName === verificationSubject;
    });

    if (!hasExistingEmployerVerification) {
      db.verifications.unshift({
        id: makeId("verification"),
        type: "Employer Verification",
        subjectName: verificationSubject,
        email: payload.email,
        status: "pending",
        submittedAt: new Date().toISOString(),
        documents: [],
        notes: undefined,
      });
    }

  }
  // Admin role: no profile needed

  appendAuditLog(db, { actor: payload.fullName, action: "created account", target: payload.role });
  return user;
}
