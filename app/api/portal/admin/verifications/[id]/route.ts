import { NextResponse } from "next/server";
import { access } from "node:fs/promises";
import path from "node:path";

import { requirePortalRole } from "@/lib/backend/auth";
import { readDatabase } from "@/lib/backend/store";
import { supabaseAdmin } from "@/lib/supabase-server";

const BUCKET_NAME = process.env.SUPABASE_VERIFICATION_BUCKET || "verification-ids";

function getDocumentKind(documentPath: string) {
  const lowerPath = documentPath.toLowerCase();

  if (lowerPath.endsWith(".pdf")) {
    return "pdf";
  }

  if (/\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(lowerPath)) {
    return "image";
  }

  return "file";
}

function encodePublicPath(documentPath: string) {
  return `/${documentPath
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/")}`;
}

async function resolvePublicDocumentUrl(documentPath: string) {
  const publicPath = path.join(process.cwd(), "public", ...documentPath.split("/"));

  try {
    await access(publicPath);
    return encodePublicPath(documentPath);
  } catch {
    return null;
  }
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const admin = await requirePortalRole(request, "admin");
  if (!admin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const db = await readDatabase();
  const verification = db.verifications.find((item) => item.id === id);

  if (!verification) {
    return NextResponse.json({ error: "Verification not found" }, { status: 404 });
  }

  const documents = await Promise.all(
    (verification.documents ?? []).map(async (documentPath) => {
      const normalizedPath = documentPath?.trim() ?? "";
      if (!normalizedPath) {
        return null;
      }

      if (/^https?:\/\//i.test(normalizedPath)) {
        return {
          name: normalizedPath.split("/").pop() ?? normalizedPath,
          path: normalizedPath,
          url: normalizedPath,
          kind: getDocumentKind(normalizedPath),
        };
      }

      if (!normalizedPath.includes("/")) {
        const publicUrl = await resolvePublicDocumentUrl(normalizedPath);
        return {
          name: normalizedPath,
          path: normalizedPath,
          url: publicUrl,
          kind: getDocumentKind(normalizedPath),
          error: publicUrl ? undefined : "Legacy document file was not found in storage or /public.",
        };
      }

      if (!supabaseAdmin) {
        return {
          name: normalizedPath.split("/").pop() ?? normalizedPath,
          path: normalizedPath,
          url: null,
          kind: getDocumentKind(normalizedPath),
          error: "Supabase not configured",
        };
      }

      const { data, error } = await supabaseAdmin.storage.from(BUCKET_NAME).createSignedUrl(normalizedPath, 60 * 60);
      if (error) {
        return {
          name: normalizedPath.split("/").pop() ?? normalizedPath,
          path: normalizedPath,
          url: null,
          kind: getDocumentKind(normalizedPath),
          error: error.message,
        };
      }

      return {
        name: normalizedPath.split("/").pop() ?? normalizedPath,
        path: normalizedPath,
        url: data.signedUrl,
        kind: getDocumentKind(normalizedPath),
      };
    })
  );

  return NextResponse.json({
    verification,
    documents: documents.filter(Boolean),
  });
}
