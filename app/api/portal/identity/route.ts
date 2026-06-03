import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { supabaseAdmin } from "@/lib/supabase-server";

const BUCKET_NAME = process.env.SUPABASE_VERIFICATION_BUCKET || "verification-ids";
const OCR_SPACE_API_URL = process.env.OCR_SPACE_API_URL || "https://api.ocr.space/parse/image";

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
    fileSizeLimit: 10 * 1024 * 1024,
    allowedMimeTypes: ["image/jpeg", "image/png", "image/webp", "application/pdf"],
  });

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw new Error(`Unable to create Supabase storage bucket: ${createError.message}`);
  }
}

async function runOcr(file: File) {
  const apiKey = process.env.OCR_SPACE_API_KEY;
  if (!apiKey) {
    return {
      text: "",
      provider: "unconfigured",
      warning: "OCR provider is not configured. Set OCR_SPACE_API_KEY to enable text extraction.",
    };
  }

  const formData = new FormData();
  formData.append("file", file, file.name);
  formData.append("language", "eng");
  formData.append("OCREngine", "2");
  formData.append("scale", "true");
  formData.append("isTable", "false");

  const response = await fetch(OCR_SPACE_API_URL, {
    method: "POST",
    headers: {
      apikey: apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    const responseText = await response.text();
    throw new Error(`OCR request failed: ${response.status} ${responseText}`);
  }

  const result = (await response.json()) as {
    IsErroredOnProcessing?: boolean;
    ErrorMessage?: string[] | string;
    ParsedResults?: Array<{ ParsedText?: string }>;
  };

  if (result.IsErroredOnProcessing) {
    const errorMessage = Array.isArray(result.ErrorMessage)
      ? result.ErrorMessage.join(", ")
      : result.ErrorMessage || "Unknown OCR error";
    throw new Error(errorMessage);
  }

  const text = (result.ParsedResults ?? [])
    .map((item) => item.ParsedText?.trim() ?? "")
    .filter(Boolean)
    .join("\n");

  return {
    text,
    provider: "ocr.space",
    warning: text ? null : "No OCR text was detected from this file.",
  };
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    const side = formData.get("side");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "A file upload is required." }, { status: 400 });
    }

    if (typeof side !== "string" || (side !== "front" && side !== "back" && side !== "permit")) {
      return NextResponse.json({ error: "File side must be front, back, or permit." }, { status: 400 });
    }

    await ensureBucket();

    const fileExt = file.name.includes(".") ? file.name.split(".").pop() : "bin";
    const objectPath = `ids/${new Date().toISOString().slice(0, 10)}/${side}-${randomUUID()}.${fileExt}`;
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

    const ocrResult = await runOcr(file);

    return NextResponse.json({
      ok: true,
      side,
      fileName: file.name,
      bucket: BUCKET_NAME,
      objectPath,
      ocrText: ocrResult.text,
      ocrProvider: ocrResult.provider,
      warning: ocrResult.warning,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unable to upload and scan ID.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
