import type { ApplicantProfile } from "@/lib/backend/types";

export type ApplicantProfileMeta = {
  headline?: string;
  photoUrl?: string;
};

export function parseApplicantProfileMeta(headline?: string | null): ApplicantProfileMeta {
  if (!headline) return {};
  try {
    const parsed = JSON.parse(headline) as ApplicantProfileMeta;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    return { headline };
  }
  return {};
}

export function serializeApplicantProfileMeta(meta: ApplicantProfileMeta) {
  return JSON.stringify(meta);
}

export function getApplicantHeadlineText(headline?: string | null) {
  const meta = parseApplicantProfileMeta(headline);
  return meta.headline ?? headline ?? "";
}

export function getApplicantPhotoUrl(headline?: string | null) {
  return parseApplicantProfileMeta(headline).photoUrl ?? null;
}

export function resolveApplicantProfileForApplication(
  applicantProfiles: ApplicantProfile[],
  application: { applicantId?: string; email?: string | null },
) {
  return (
    applicantProfiles.find((profile) => profile.id === application.applicantId) ??
    applicantProfiles.find(
      (profile) => (profile.email ?? "").toLowerCase() === (application.email ?? "").toLowerCase(),
    ) ??
    null
  );
}
