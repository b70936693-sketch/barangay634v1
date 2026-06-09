const PRODUCTION_FALLBACK = "https://barangay634.vercel.app";

function normalizeBaseUrl(url: string) {
  return url.replace(/\/$/, "");
}

function isLocalUrl(url: string) {
  try {
    const hostname = new URL(url).hostname;
    return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
  } catch {
    return false;
  }
}

export function getAppBaseUrl() {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.NEXT_PUBLIC_APP_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
  ].filter((value): value is string => Boolean(value));

  for (const candidate of candidates) {
    const normalized = normalizeBaseUrl(candidate);
    if (!isLocalUrl(normalized)) {
      return normalized;
    }
  }

  return PRODUCTION_FALLBACK;
}

export function getApplicantApplicationsUrl() {
  return `${getAppBaseUrl()}/applicant/applications`;
}

export function getApplicantDiscoverUrl() {
  return `${getAppBaseUrl()}/applicant`;
}
