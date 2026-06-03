import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { getCurrentPortalUser } from "@/lib/backend/auth";
import { supabaseAdmin } from "@/lib/supabase-server";

const BUCKET_NAME = process.env.SUPABASE_APPLICATION_BUCKET || "application-documents";

async function ensureBucket() {
  if (!supabaseAdmin) {
    throw new Error("Supabase is not configured. Please set environment variables.");
  }

  const { data: buckets, error } = await supabaseAdmin.storage.listBuckets();
  if (error) {
    throw new Error(`Unable to inspect Supabase storage buckets: ${error.message}`);
  }

  if (buckets.some((bucket) => bucket.name === BUCKET_NAME)) {
    return;
  }

  const { error: createError } = await supabaseAdmin.storage.createBucket(BUCKET_NAME, {
    public: false,
    fileSizeLimit: 20 * 1024 * 1024,
    allowedMimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "image/jpeg",
      "image/png",
      "image/webp",
      "text/plain",
    ],
  });

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(`Unable to create Supabase storage bucket: ${createError.message}`);
  }
}

export async function POST(request: Request) {
  try {
    const { portalUser } = await getCurrentPortalUser(request);
    if (!portalUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file");
    const fileName = String(formData.get("name") ?? "");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A file upload is required." }, { status: 400 });
    }

    if (!fileName) {
      return NextResponse.json({ error: "File name is required." }, { status: 400 });
    }

    await ensureBucket();

    const fileExt = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const objectPath = `applications/${portalUser.id}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${fileExt}`;
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await supabaseAdmin!.storage
      .from(BUCKET_NAME)
      .upload(objectPath, fileBuffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Supabase upload failed: ${uploadError.message}`);
    }

    return NextResponse.json({
      document: {
        id: randomUUID(),
        name: fileName,
        path: objectPath,
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to upload document.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const { portalUser } = await getCurrentPortalUser(request);
    if (!portalUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const path = url.searchParams.get("path")?.trim();

    if (!path) {
      return NextResponse.json({ error: "Missing path query parameter." }, { status: 400 });
    }

    if (!supabaseAdmin) {
      return NextResponse.json({ error: "Supabase is not configured." }, { status: 500 });
    }

    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .createSignedUrl(path, 60);

    if (error || !data?.signedUrl) {
      const message = error?.message ?? "Unable to create signed URL.";
      return NextResponse.json({ error: message }, { status: 500 });
    }

    return NextResponse.redirect(data.signedUrl);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to resolve document URL.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
