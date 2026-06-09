import { getApplicantPhotoUrl } from "@/lib/applicant-profile-meta";
import { getEmployerLogoUrl } from "@/lib/employer-profile-meta";
import type { PortalDatabase, VerificationRecord } from "@/lib/backend/types";

export type AdminVerificationItem = VerificationRecord & {
  queueId: string;
  actionType: "verification" | "employer" | "applicant";
  actionId: string;
  employerId?: string | null;
  applicantUserId?: string | null;
  imageUrl?: string | null;
  imageKind: "employer" | "applicant";
  documentCount: number;
};

function verificationKey(type: VerificationRecord["type"], email?: string | null, subjectName?: string) {
  return `${type}:${(email ?? subjectName ?? "").toLowerCase()}`;
}

function resolveEmployerStatus(verified: boolean, userStatus?: string) {
  if (verified) return "approved" as const;
  if (userStatus === "suspended") return "rejected" as const;
  return "pending" as const;
}

function resolveApplicantStatus(userStatus?: string) {
  if (userStatus === "verified") return "approved" as const;
  if (userStatus === "suspended") return "rejected" as const;
  return "pending" as const;
}

export function buildAdminVerificationQueue(db: PortalDatabase): AdminVerificationItem[] {
  const items: AdminVerificationItem[] = [];
  const seen = new Set<string>();

  for (const record of db.verifications) {
    const key = verificationKey(record.type, record.email, record.subjectName);
    seen.add(key);

    const employer =
      record.type === "Employer Verification"
        ? db.employerProfiles.find(
            (profile) =>
              profile.companyName === record.subjectName ||
              profile.contactPerson === record.subjectName ||
              db.users.find((user) => user.id === profile.userId)?.email?.toLowerCase() ===
                record.email?.toLowerCase(),
          )
        : null;
    const applicantProfile =
      record.type === "Applicant Verification"
        ? db.applicantProfiles.find(
            (profile) =>
              profile.email?.toLowerCase() === record.email?.toLowerCase() ||
              profile.fullName === record.subjectName,
          )
        : null;

    items.push({
      ...record,
      queueId: record.id,
      actionType: "verification",
      actionId: record.id,
      employerId: employer?.id ?? null,
      applicantUserId: applicantProfile?.userId ?? null,
      imageUrl:
        record.type === "Employer Verification"
          ? getEmployerLogoUrl(employer?.headline)
          : getApplicantPhotoUrl(applicantProfile?.headline),
      imageKind: record.type === "Employer Verification" ? "employer" : "applicant",
      documentCount: record.documents?.length ?? 0,
    });
  }

  for (const profile of db.employerProfiles) {
    const user = db.users.find((entry) => entry.id === profile.userId);
    const key = verificationKey("Employer Verification", user?.email, profile.companyName);
    if (seen.has(key)) continue;
    seen.add(key);

    const status = resolveEmployerStatus(profile.verified, user?.status);
    items.push({
      id: `employer-${profile.id}`,
      queueId: `employer-${profile.id}`,
      type: "Employer Verification",
      subjectName: profile.companyName,
      email: user?.email,
      status,
      submittedAt: user?.createdAt ?? new Date().toISOString(),
      documents: [],
      notes: profile.businessType ? `Business type: ${profile.businessType}` : undefined,
      actionType: "employer",
      actionId: profile.id,
      employerId: profile.id,
      applicantUserId: null,
      imageUrl: getEmployerLogoUrl(profile.headline),
      imageKind: "employer",
      documentCount: 0,
    });
  }

  for (const user of db.users.filter((entry) => entry.role === "applicant")) {
    const profile =
      db.applicantProfiles.find((entry) => entry.userId === user.id) ??
      db.applicantProfiles.find((entry) => entry.email?.toLowerCase() === user.email?.toLowerCase());
    const key = verificationKey("Applicant Verification", user.email, profile?.fullName ?? user.fullName);
    if (seen.has(key)) continue;
    seen.add(key);

    const status = resolveApplicantStatus(user.status);
    items.push({
      id: `applicant-${user.id}`,
      queueId: `applicant-${user.id}`,
      type: "Applicant Verification",
      subjectName: profile?.fullName ?? user.fullName,
      email: user.email,
      status,
      submittedAt: user.createdAt,
      documents: profile?.documentsReady ?? [],
      notes: profile?.address ? `Address: ${profile.address}` : undefined,
      actionType: "applicant",
      actionId: user.id,
      employerId: null,
      applicantUserId: user.id,
      imageUrl: getApplicantPhotoUrl(profile?.headline),
      imageKind: "applicant",
      documentCount: profile?.documentsReady?.length ?? 0,
    });
  }

  return items.sort((a, b) => +new Date(b.submittedAt) - +new Date(a.submittedAt));
}
