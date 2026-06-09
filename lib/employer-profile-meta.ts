export type EmployerProfileMeta = {
  tagline?: string;
  logoUrl?: string;
};

export function parseEmployerProfileMeta(headline?: string | null): EmployerProfileMeta {
  if (!headline) return {};
  try {
    const parsed = JSON.parse(headline) as EmployerProfileMeta;
    if (parsed && typeof parsed === "object") {
      return parsed;
    }
  } catch {
    return { tagline: headline };
  }
  return {};
}

export function serializeEmployerProfileMeta(meta: EmployerProfileMeta) {
  return JSON.stringify(meta);
}

export function getEmployerLogoUrl(headline?: string | null) {
  return parseEmployerProfileMeta(headline).logoUrl ?? null;
}
