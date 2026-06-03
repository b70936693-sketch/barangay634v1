export function getDocumentName(document: unknown) {
  const raw =
    typeof document === "string"
      ? document
      : typeof document === "object" && document !== null && "name" in document
        ? String((document as { name?: unknown }).name ?? "")
        : "Document";

  const trimmed = raw.trim();
  if (!trimmed) {
    return "Document";
  }

  const parts = trimmed.split(/[\\/]/);
  return parts[parts.length - 1] || trimmed;
}

export function getDocumentHref(document: unknown) {
  const raw =
    typeof document === "string"
      ? document
      : typeof document === "object" && document !== null
        ? String(
            (document as { url?: unknown; path?: unknown; name?: unknown }).url ??
              (document as { path?: unknown }).path ??
              (document as { name?: unknown }).name ??
              "",
          )
        : "";

  const trimmed = raw.trim();

  if (/^(https?:|data:|blob:|mailto:|tel:|\/)/i.test(trimmed)) {
    return trimmed;
  }

  if (/^[\w\-.]+\/[\w\-.]+(?:\/[\w\-.]+)*\.(pdf|docx?|doc|xls|xlsx|pptx?|ppt|png|jpe?g|gif|webp|bmp|svg|txt)$/i.test(trimmed)) {
    return `/api/portal/application-documents?path=${encodeURIComponent(trimmed)}`;
  }

  return "";
}

export function getMailtoHref(email: string | null | undefined, subject: string, body: string) {
  const safeEmail = email?.trim() || "";
  const params = new URLSearchParams({
    subject,
    body,
  });

  return `mailto:${safeEmail}?${params.toString()}`;
}
