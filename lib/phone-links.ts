export function normalizePhoneForLink(phone?: string | null) {
  const digits = String(phone ?? "").replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("63") && digits.length >= 12) {
    return `+${digits}`;
  }

  if (digits.startsWith("0") && digits.length >= 10) {
    return `+63${digits.slice(1)}`;
  }

  if (digits.length === 10 || digits.length === 9) {
    return `+63${digits}`;
  }

  return `+${digits}`;
}

export function buildTelLink(phone?: string | null) {
  const normalized = normalizePhoneForLink(phone);
  return normalized ? `tel:${normalized}` : "";
}

export function buildSmsLink(phone?: string | null, body?: string) {
  const normalized = normalizePhoneForLink(phone);
  if (!normalized) return "";

  const base = `sms:${normalized}`;
  return body ? `${base}?body=${encodeURIComponent(body)}` : base;
}

export function buildMailtoLink(email?: string | null, subject?: string, body?: string) {
  const trimmed = String(email ?? "").trim();
  if (!trimmed) return "";

  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const query = params.toString();

  return query ? `mailto:${trimmed}?${query}` : `mailto:${trimmed}`;
}

export function formatPhoneDisplay(phone?: string | null) {
  const normalized = normalizePhoneForLink(phone);
  if (!normalized) return "";

  const digits = normalized.replace(/\D/g, "");
  if (digits.startsWith("63") && digits.length === 12) {
    return `+63 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }

  return phone?.trim() ?? normalized;
}
