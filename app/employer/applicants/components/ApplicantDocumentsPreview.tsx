"use client";

import { useEffect, useState } from "react";
import { Download, ExternalLink, Eye, FileText } from "lucide-react";
import { getDocumentHref, getDocumentName } from "@/app/employer/lib/portal-actions";
import { Button } from "@/components/ui/button";

type PreviewDoc = {
  url: string;
  name: string;
  isImage: boolean;
};

function isImageUrl(url: string) {
  return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(url);
}

function buildPreview(doc: unknown): PreviewDoc | null {
  const url = getDocumentHref(doc);
  if (!url) return null;
  return {
    url,
    name: getDocumentName(doc),
    isImage: isImageUrl(url),
  };
}

export function ApplicantDocumentsPreview({ documents }: { documents: unknown[] }) {
  const [previewDoc, setPreviewDoc] = useState<PreviewDoc | null>(null);

  useEffect(() => {
    if (!documents.length) {
      setPreviewDoc(null);
      return;
    }
    setPreviewDoc((current) => current ?? buildPreview(documents[0]));
  }, [documents]);

  const openPreview = (doc: unknown) => {
    setPreviewDoc(buildPreview(doc));
  };

  if (!documents.length) {
    return <p className="text-sm text-muted-foreground">No documents attached.</p>;
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="space-y-2">
        {documents.map((doc, index) => {
          const href = getDocumentHref(doc);
          const name = getDocumentName(doc);
          const selected = previewDoc?.url === href && previewDoc?.name === name;
          const thumbIsImage = href ? isImageUrl(href) : false;

          return (
            <button
              key={`${name}-${index}`}
              type="button"
              disabled={!href}
              onClick={() => openPreview(doc)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-3 text-left transition ${
                selected
                  ? "border-[#2f6fa4] bg-[#f2f8fd]"
                  : "border-border bg-white hover:border-[#b9d0e8] hover:bg-slate-50"
              }`}
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-slate-50">
                {href && thumbIsImage ? (
                  <img src={href} alt={name} className="h-full w-full object-cover" />
                ) : (
                  <FileText className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="text-xs text-muted-foreground">{href ? "Click to preview" : "Unavailable"}</p>
              </div>
              {href ? <Eye className="h-4 w-4 shrink-0 text-muted-foreground" /> : null}
            </button>
          );
        })}
      </div>

      <div className="rounded-xl border border-border bg-slate-50 p-4">
        {previewDoc ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{previewDoc.name}</p>
                <p className="text-xs text-muted-foreground">Document preview</p>
              </div>
              <div className="flex shrink-0 gap-1.5">
                <Button asChild variant="outline" size="sm" className="h-8 gap-1 text-xs">
                  <a href={previewDoc.url} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" />
                    Open
                  </a>
                </Button>
                <Button asChild variant="outline" size="sm" className="h-8 gap-1 text-xs">
                  <a href={previewDoc.url} target="_blank" rel="noreferrer" download>
                    <Download className="h-3.5 w-3.5" />
                    Download
                  </a>
                </Button>
              </div>
            </div>

            {previewDoc.isImage ? (
              <img
                src={previewDoc.url}
                alt={previewDoc.name}
                className="mx-auto max-h-[420px] w-full rounded-lg border border-border bg-white object-contain"
              />
            ) : (
              <div className="space-y-3 rounded-lg border border-border bg-white p-3">
                <p className="text-xs text-muted-foreground">
                  Inline preview may be limited for this file type. Use Open or Download if needed.
                </p>
                <iframe
                  src={previewDoc.url}
                  title={previewDoc.name}
                  className="h-[360px] w-full rounded-md border border-border bg-white"
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex min-h-[240px] flex-col items-center justify-center rounded-lg border border-dashed border-border bg-white p-6 text-center text-sm text-muted-foreground">
            <FileText className="mb-2 h-8 w-8 text-muted-foreground/50" />
            Select a document to preview it here.
          </div>
        )}
      </div>
    </div>
  );
}
