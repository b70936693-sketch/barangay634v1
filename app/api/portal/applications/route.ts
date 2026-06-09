import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";

import { requirePortalRole, getCurrentPortalUser } from "@/lib/backend/auth";
import { getApplicantProfileByUserId, readDatabase, writeDatabase, makeId, createApplication, updateApplication } from "@/lib/backend/store";

function camelToSnake(obj: any): any {
  if (obj === null || typeof obj !== 'object') return obj;
  
  if (Array.isArray(obj)) return obj.map(camelToSnake);
  
  const result: any = {};
  for (const [key, value] of Object.entries(obj)) {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    result[snakeKey] = camelToSnake(value);
  }
  return result;
}

export async function POST(request: Request) {
  const { portalUser } = await getCurrentPortalUser(request);
  if (!portalUser) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const payload = body.payload ?? body;
  const transformedBody = camelToSnake({
    ...payload,
    jobPostId: body.jobPostId ?? payload.jobPostId,
  });

  const db = await readDatabase();

  // Ensure portal user exists in the active store and has applicant role
  let userRecord = db.users.find((record) => record.id === portalUser.id);
  if (!userRecord) {
    userRecord = {
      id: portalUser.id,
      role: "applicant",
      fullName: portalUser.fullName || "",
      email: portalUser.email || "",
      phone: portalUser.phone || "",
      status: portalUser.status || "pending",
      createdAt: new Date().toISOString(),
    };
    db.users.unshift(userRecord);
  } else if (userRecord.role !== "applicant") {
    userRecord.role = "applicant";
  }

  const user = { ...portalUser, role: "applicant" as const };
  let applicantProfile = getApplicantProfileByUserId(db, user.id);
  
  if (!applicantProfile) {
    applicantProfile = {
      id: makeId("applicant"),
      userId: user.id,
      fullName: user.fullName || "",
      preferredName: "",
      email: user.email || "",
      phone: user.phone || "",
      barangay: "",
      address: "",
      headline: "",
      bio: "",
      skills: [],
      documentsReady: [],
    };
    db.applicantProfiles.unshift(applicantProfile);
  }

  const documents = Array.isArray(transformedBody.documents)
    ? transformedBody.documents.map((item: any) => {
        if (typeof item === "string") {
          return { id: randomUUID(), name: item };
        }

        if (item && typeof item === "object") {
          return {
            id: item?.id || randomUUID(),
            name: String(item?.name ?? item?.path ?? "Document"),
            path: item?.path ? String(item.path) : undefined,
            url: item?.url ? String(item.url) : undefined,
          };
        }

        return { id: randomUUID(), name: String(item ?? "Document") };
      })
    : [];

  const application = (() => {
    // Enforce: employer must be admin-verified and job post must be admin-approved (active)
    const jobPostId = transformedBody.job_post_id ?? transformedBody.jobPostId;
    const jobPost = db.jobPosts.find((p) => p.id === jobPostId);
    if (!jobPost) {
      return { error: "Job post not found" } as const;
    }

    if (jobPost.status !== "active") {
      return { error: "Job post not approved by admin yet" } as const;
    }

    const employerProfile =
      db.employerProfiles.find((p) => p.id === jobPost.employerId) ??
      db.employerProfiles.find((p) => p.userId === jobPost.employerId);
    if (!employerProfile || !employerProfile.verified) {
      return { error: "Employer not verified by admin yet" } as const;
    }

    const alreadyApplied = db.applications.some(
      (existing) =>
        existing.jobPostId === jobPostId &&
        (existing.applicantId === applicantProfile.id ||
          existing.email?.toLowerCase() === (transformedBody.email ?? "").toLowerCase()),
    );
    if (alreadyApplied) {
      return { error: "You have already applied to this job post" } as const;
    }

    return createApplication(db, {
      jobPostId,
      applicantId: applicantProfile.id,
      fullName: transformedBody.full_name || user.fullName,
      email: transformedBody.email,
      contact: transformedBody.phone,
      availability: transformedBody.availability || "",
      shiftPreference: transformedBody.shift_preference || "",
      introduction: transformedBody.introduction || "",
      documents: documents as any,
    });
  })();

  if (!application || (application as any).error) {
    return NextResponse.json({ error: (application as any)?.error ?? "Job post not found or inactive" }, { status: 400 });
  }

  try {
    await writeDatabase(db);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save application";
    console.error("Application write failed:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ application });
}

export async function PUT(request: Request) {
  const user = await requirePortalRole(request, "applicant");
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { applicationId, ...payload } = body;

  if (!applicationId) {
    return NextResponse.json({ error: "Application ID required" }, { status: 400 });
  }

  const db = await readDatabase();
  const applicantProfile = getApplicantProfileByUserId(db, user.id);

  if (!applicantProfile) {
    return NextResponse.json({ error: "Applicant profile not found" }, { status: 404 });
  }

  // Check if the application belongs to this user
  const application = db.applications.find(app => app.id === applicationId && app.applicantId === applicantProfile.id);
  if (!application) {
    return NextResponse.json({ error: "Application not found or access denied" }, { status: 404 });
  }

  // Only allow updates for pending/reviewing applications
  if (!["pending", "reviewing"].includes(application.status)) {
    return NextResponse.json({ error: "Cannot update application in current status" }, { status: 400 });
  }

  const documents = Array.isArray(payload.documents)
    ? payload.documents.map((item: any) => {
        if (typeof item === "string") {
          return { id: randomUUID(), name: item };
        }

        if (item && typeof item === "object") {
          return {
            id: item?.id || randomUUID(),
            name: String(item?.name ?? item?.path ?? "Document"),
            path: item?.path ? String(item.path) : undefined,
            url: item?.url ? String(item.url) : undefined,
          };
        }

        return { id: randomUUID(), name: String(item ?? "Document") };
      })
    : [];

  const updatedApplication = updateApplication(db, applicationId, {
    fullName: payload.fullName,
    email: payload.email,
    contact: payload.contact || payload.phone,
    availability: payload.availability,
    shiftPreference: payload.shiftPreference,
    introduction: payload.introduction,
    documents: documents,
  });

  if (!updatedApplication) {
    return NextResponse.json({ error: "Failed to update application" }, { status: 500 });
  }

  await writeDatabase(db);
    
  return NextResponse.json({ application: updatedApplication });
}
