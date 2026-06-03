import { randomUUID } from "node:crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/backend/prisma";
import { readDatabase, writeDatabase } from "@/lib/backend/store";
import { supabaseAdmin } from "@/lib/supabase-server";

type VerificationRole = "applicant" | "employer";

async function ensurePortalAccount(input: {
  role: VerificationRole;
  fullName: string;
  email: string;
  phone?: string;
  address: string;
  barangay: string;
}) {
  const normalizedEmail = input.email.toLowerCase();
  const phone = input.phone ?? "";

  if (process.env.DATABASE_URL) {
    const user = await prisma.user.upsert({
      where: { email: normalizedEmail },
      update: {
        role: input.role,
        fullName: input.fullName,
        phone,
      },
      create: {
        id: randomUUID(),
        email: normalizedEmail,
        role: input.role,
        fullName: input.fullName,
        phone,
        status: "pending",
      },
    });

    if (input.role === "applicant") {
      await prisma.applicantProfile.upsert({
        where: { userId: user.id },
        update: {
          fullName: input.fullName,
          email: normalizedEmail,
          phone,
          barangay: input.barangay,
          address: input.address,
        },
        create: {
          id: randomUUID(),
          userId: user.id,
          fullName: input.fullName,
          preferredName: input.fullName.split(" ")[0] ?? input.fullName,
          email: normalizedEmail,
          phone,
          barangay: input.barangay,
          address: input.address,
          headline: "Pending applicant verification",
          bio: "",
          skills: [],
          documentsReady: [],
        },
      });
    } else {
      await prisma.employerProfile.upsert({
        where: { userId: user.id },
        update: {
          contactPerson: input.fullName,
          companyName: `${input.fullName}'s Business`,
          verified: false,
        },
        create: {
          id: randomUUID(),
          userId: user.id,
          companyName: `${input.fullName}'s Business`,
          contactPerson: input.fullName,
          headline: "Pending employer verification",
          location: input.barangay,
          verified: false,
          businessType: "Pending business type",
        },
      });
    }

    return;
  }

  if (!supabaseAdmin) {
    const db = await readDatabase();
    const existingUser = db.users.find((item) => item.email.toLowerCase() === normalizedEmail);

    if (!existingUser) {
      db.users.unshift({
        id: randomUUID(),
        role: input.role,
        fullName: input.fullName,
        email: normalizedEmail,
        phone,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
    }

    await writeDatabase(db);
    return;
  }

  const { data: existingUser } = await supabaseAdmin
    .from("users")
    .select("id,status")
    .eq("email", normalizedEmail)
    .maybeSingle();

  const userId = existingUser?.id ?? randomUUID();

  await supabaseAdmin.from("users").upsert(
    {
      id: userId,
      role: input.role,
      full_name: input.fullName,
      email: normalizedEmail,
      phone,
      status: existingUser?.status === "verified" ? "verified" : "pending",
    },
    { onConflict: "email" }
  );

  if (input.role === "applicant") {
    const { data: existingProfile } = await supabaseAdmin
      .from("applicant_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    await supabaseAdmin.from("applicant_profiles").upsert(
      {
        id: existingProfile?.id ?? randomUUID(),
        user_id: userId,
        full_name: input.fullName,
        preferred_name: input.fullName.split(" ")[0] ?? input.fullName,
        email: normalizedEmail,
        phone,
        barangay: input.barangay,
        address: input.address,
        headline: "Pending applicant verification",
        bio: "",
        skills: [],
        documents_ready: [],
      },
      { onConflict: "id" }
    );
  } else {
    const { data: existingProfile } = await supabaseAdmin
      .from("employer_profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    await supabaseAdmin.from("employer_profiles").upsert(
      {
        id: existingProfile?.id ?? randomUUID(),
        user_id: userId,
        company_name: `${input.fullName}'s Business`,
        contact_person: input.fullName,
        headline: "Pending employer verification",
        location: input.barangay,
        verified: false,
        business_type: "Pending business type",
      },
      { onConflict: "id" }
    );
  }
}

async function createVerificationRecord(input: {
  type: VerificationRole;
  fullName: string;
  email: string;
  documents: string[];
  notes?: string;
}) {
  const submittedAt = new Date().toISOString();

  if (process.env.DATABASE_URL) {
    return prisma.verification.create({
      data: {
        id: randomUUID(),
        type: input.type === "employer" ? "EmployerVerification" : "ApplicantVerification",
        subjectName: input.fullName,
        status: "pending",
        submittedAt,
        email: input.email.toLowerCase(),
        documents: input.documents,
        notes: input.notes,
      },
    });
  }

  if (supabaseAdmin) {
    const fullPayload = {
      id: randomUUID(),
      type: input.type === "employer" ? "Employer Verification" : "Applicant Verification",
      subject_name: input.fullName,
      status: "pending",
      submitted_at: submittedAt,
      email: input.email.toLowerCase(),
      documents: input.documents,
      notes: input.notes ?? null,
    };

    const fullInsert = await supabaseAdmin.from("verifications").insert(fullPayload).select("*").maybeSingle();
    if (!fullInsert.error) {
      return fullInsert.data;
    }

    const minimalInsert = await supabaseAdmin
      .from("verifications")
      .insert({
        id: fullPayload.id,
        type: fullPayload.type,
        subject_name: fullPayload.subject_name,
        status: fullPayload.status,
        submitted_at: fullPayload.submitted_at,
      })
      .select("*")
      .maybeSingle();

    if (minimalInsert.error) {
      throw new Error(minimalInsert.error.message);
    }

    return minimalInsert.data;
  }

  const db = await readDatabase();
  const localVerificationType: "Applicant Verification" | "Employer Verification" =
    input.type === "employer" ? "Employer Verification" : "Applicant Verification";
  const verification = {
    id: randomUUID(),
    type: localVerificationType,
    subjectName: input.fullName,
    status: "pending" as const,
    submittedAt,
    email: input.email.toLowerCase(),
    documents: input.documents,
    notes: input.notes,
  };

  db.verifications.unshift(verification);
  await writeDatabase(db);
  return verification;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { fullName, email, phone, address, barangay, documents, notes, type } = body ?? {};

  if (!fullName || !email || !address || !barangay || !Array.isArray(documents) || documents.length === 0) {
    return NextResponse.json({ error: "Missing required verification fields" }, { status: 400 });
  }

  const role: VerificationRole = type === "employer" ? "employer" : "applicant";

  try {
    await ensurePortalAccount({
      role,
      fullName,
      email,
      phone,
      address,
      barangay,
    });

    const verification = await createVerificationRecord({
      type: role,
      fullName,
      email,
      documents,
      notes,
    });

    return NextResponse.json({ verification });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to save verification submission.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
