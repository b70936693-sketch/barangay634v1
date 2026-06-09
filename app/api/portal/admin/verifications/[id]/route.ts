import { NextResponse } from "next/server";
import { access } from "node:fs/promises";
import path from "node:path";

import { requirePortalRole } from "@/lib/backend/auth";
import { readDatabase } from "@/lib/backend/store";
import type { PortalDatabase, VerificationRecord } from "@/lib/backend/types";
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

function resolveVerificationContext(db: PortalDatabase, id: string) {
  const direct = db.verifications.find((item) => item.id === id);
  if (direct) {
    return { verification: direct, documentPaths: direct.documents ?? [] };
  }

  if (id.startsWith("employer-")) {
    const employerId = id.slice("employer-".length);
    const employer = db.employerProfiles.find((profile) => profile.id === employerId);
    if (!employer) return null;

    const user = db.users.find((entry) => entry.id === employer.userId);
    const verification = db.verifications.find(
      (record) =>
        record.type === "Employer Verification" &&
        (record.email?.toLowerCase() === user?.email?.toLowerCase() ||
          record.subjectName === employer.companyName ||
          record.subjectName === employer.contactPerson)
    );

    return {
      verification:
        verification ??
        ({
          id,
          type: "Employer Verification",
          subjectName: employer.companyName,
          email: user?.email,
          status: employer.verified ? "approved" : "pending",
          submittedAt: user?.createdAt ?? new Date().toISOString(),
          documents: [],
        } satisfies VerificationRecord),
      documentPaths: verification?.documents ?? [],
    };
  }

  if (id.startsWith("applicant-")) {
    const userId = id.slice("applicant-".length);
    const user = db.users.find((entry) => entry.id === userId);
    if (!user) return null;

    const profile =
      db.applicantProfiles.find((entry) => entry.userId === userId) ??
      db.applicantProfiles.find((entry) => entry.email?.toLowerCase() === user.email?.toLowerCase());

    const verification = db.verifications.find(
      (record) =>
        record.type === "Applicant Verification" &&
        (record.email?.toLowerCase() === user.email?.toLowerCase() ||
          record.subjectName === (profile?.fullName ?? user.fullName))
    );

    const documentPaths =
      verification?.documents?.length ? verification.documents : (profile?.documentsReady ?? []);

    return {
      verification:
        verification ??
        ({
          id,
          type: "Applicant Verification",
          subjectName: profile?.fullName ?? user.fullName,
          email: user.email,
          status: user.status === "verified" ? "approved" : user.status === "suspended" ? "rejected" : "pending",
          submittedAt: user.createdAt,
          documents: documentPaths,
        } satisfies VerificationRecord),
      documentPaths,
    };
  }

  return null;
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
  const contextResult = resolveVerificationContext(db, id);

  if (!contextResult) {
    return NextResponse.json({ error: "Verification not found" }, { status: 404 });
  }

  const { verification, documentPaths } = contextResult;

  const documents = await Promise.all(
    documentPaths.map(async (documentPath) => {
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
