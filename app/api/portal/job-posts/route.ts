import { NextResponse } from "next/server";

import { getCurrentPortalUser } from "@/lib/backend/auth";
import { appendAuditLog, getOrCreateEmployerProfile, makeId, readDatabase, withDerivedData, writeDatabase } from "@/lib/backend/store";
import { supabaseAdmin } from "@/lib/supabase-server";

import type { JobPost } from "@/lib/backend/types";

function toIsoTimestamp(value: unknown) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function buildJobPostFields(data: Record<string, unknown>) {
  const employerRequirements = Array.isArray(data.employerRequirements)
    ? data.employerRequirements
    : String(data.employerRequirements ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  const adminRequirements = Array.isArray(data.adminRequirements)
    ? data.adminRequirements
    : String(data.adminRequirements ?? "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

  return {
    employerRequirements,
    adminRequirements,
    postingStartDate: toIsoTimestamp(data.postingStartDate),
    postingEndDate: toIsoTimestamp(data.postingEndDate),
    shifts: Array.isArray(data.shifts) ? data.shifts : [],
    pwdFriendly: Boolean(data.pwdFriendly),
    seniorFriendly: Boolean(data.seniorFriendly),
    accessibilityFeatures: Array.isArray(data.accessibilityFeatures) ? data.accessibilityFeatures : [],
  };
}

export async function GET(request: Request) {
  const { portalUser } = await getCurrentPortalUser(request);
  if (!portalUser || portalUser.role !== "employer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const db = await readDatabase();
    await getOrCreateEmployerProfile(db, portalUser.id, supabaseAdmin ?? null);
    const latestDb = await readDatabase();
    const derived = withDerivedData(latestDb, portalUser);

    const jobPosts = derived.jobPosts.map((post) => ({
      ...post,
      applicant_count: post.applicantCount,
      created_at: post.createdAt,
      postedAt: post.publishedAt ?? post.createdAt,
    }));

    return NextResponse.json({ jobPosts });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch job posts";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


export async function POST(request: Request) {
  console.log("=== POST /api/portal/job-posts HIT ===");

  const { portalUser } = await getCurrentPortalUser(request);
  console.log("Portal user:", portalUser ? { id: portalUser.id, role: portalUser.role, email: portalUser.email } : "null");
  if (!portalUser || portalUser.role !== "employer") {
    console.log("Forbidden: user not employer or not logged in", {
      portalUser: portalUser ? { id: portalUser.id, role: portalUser.role } : null,
    });
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  console.log("Request body:", JSON.stringify(body, null, 2));
  const data = body.data;

  // Find or create employer profile in Supabase
  let employerProfileId: string;

  if (supabaseAdmin) {
    console.log("[job-posts] Supabase enabled for POST");
    try {
      // Try to find existing employer profile in Supabase
      const { data: existingProfile, error: profileError } = await supabaseAdmin
          .from("employer_profiles")
          .select("id")
          .eq("userId", portalUser.id)
          .single();

      if (existingProfile && !profileError) {
        employerProfileId = existingProfile.id;
      } else {
        // Create new employer profile in Supabase
        employerProfileId = makeId("employer");
        const newProfile = {
          id: employerProfileId,
          userId: portalUser.id,
          company_name: `${portalUser.fullName}'s Business`,
          contact_person: portalUser.fullName,
          headline: "New employer account",
          location: "Barangay 634",
          verified: false,
        };

        const { error: insertProfileError } = await supabaseAdmin
          .from("employer_profiles")
          .insert(newProfile);

        if (insertProfileError) {
          throw insertProfileError;
        }
      }

      const now = new Date().toISOString();

      const {
        employerRequirements,
        adminRequirements,
        postingStartDate,
        postingEndDate,
        shifts,
        pwdFriendly,
        seniorFriendly,
        accessibilityFeatures,
      } = buildJobPostFields(data);

      const normalizedTitle = String(data.title ?? "").trim().toLowerCase();
      const normalizedPosition = String(data.position ?? "").trim().toLowerCase();
      const normalizedPostType = String(data.postType ?? "").trim().toLowerCase();

      const normalizedEmployerReq = (Array.isArray(data.employerRequirements)
        ? data.employerRequirements
        : employerRequirements
      )
        .map((s: any) => String(s).trim())
        .filter(Boolean);

      const normalizedAdminReq = (Array.isArray(data.adminRequirements)
        ? data.adminRequirements
        : adminRequirements
      )
        .map((s: any) => String(s).trim())
        .filter(Boolean);

      const requirementsKey = [
        normalizedEmployerReq.join("|").toLowerCase(),
        normalizedAdminReq.join("|").toLowerCase(),
      ]
        .join("::")
        .trim();

      const duplicateKey = [
        employerProfileId,
        normalizedTitle,
        normalizedPosition,
        normalizedPostType,
        requirementsKey,
      ].join("::");

      // Prevent duplicates: if an identical pending or active job post already exists for this employer, return it.
      const { data: existingActivePosts, error: existingQueryError } = await supabaseAdmin
        .from("job_posts")
        .select("*")
        .eq("employer_id", employerProfileId)
        .in("status", ["active", "pending"]);

      if (existingQueryError) {
        console.error("Failed to query existing job posts for dedupe:", existingQueryError);
      } else {
        const normalizeReqText = (val: any) => {
          if (Array.isArray(val)) return val.map((x) => String(x).trim()).filter(Boolean).join("|").toLowerCase();
          if (val == null) return "";
          return String(val)
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean)
            .join("|")
            .toLowerCase();
        };

        const match = (existingActivePosts ?? []).find((p: any) => {
          const pTitle = String(p.title ?? "").trim().toLowerCase();
          const pPosition = String(p.position ?? "").trim().toLowerCase();
          const pPostType = String(p.post_type ?? "").trim().toLowerCase();

          const pEmployerReqText = normalizeReqText(p.employer_requirements);
          const pAdminReqText = normalizeReqText(p.admin_requirements);

          const pRequirementsKey = [pEmployerReqText, pAdminReqText].join("::").trim();
          const pDuplicateKey = [employerProfileId, pTitle, pPosition, pPostType, pRequirementsKey].join("::");

          return pDuplicateKey === duplicateKey;
        });

        if (match) {
          return NextResponse.json({ post: match, duplicate: true }, { status: 200 });
        }
      }

      const postId = makeId("job");

      const newPost = {
        id: postId,
        employer_id: employerProfileId,
        title: data.title,
        position: data.position,
        post_type: data.postType,
        status: "pending",
        qualifications: data.qualifications,
        requirements: Array.isArray(data.adminRequirements)
          ? data.adminRequirements.join(", ")
          : data.adminRequirements || "",
        description: data.description ?? "",
        employment_type: "Full-time",
        schedule: "Flexible",
        salary: "Competitive",
        urgency: "normal",
        benefits: ["Community-based employment", "Local support"],
        employer_requirements: employerRequirements,
        admin_requirements: adminRequirements,
        posting_start_date: postingStartDate,
        posting_end_date: postingEndDate,
        shifts,
        pwd_friendly: pwdFriendly,
        senior_friendly: seniorFriendly,
        accessibility_features: accessibilityFeatures,
        created_at: now,
      };

      const { data: insertedPost, error: insertError } = await supabaseAdmin
        .from("job_posts")
        .insert(newPost)
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      // Queue admin review so the listing stays hidden from applicants until approved.
      const verificationId = makeId("verification");
      const { error: verificationError } = await supabaseAdmin.from("verifications").insert({
        id: verificationId,
        type: "Employer Verification",
        subject_name: `Job Post: ${data.title}`,
        status: "pending",
        submitted_at: now,
      });

      if (verificationError) {
        console.warn("Failed to create job post verification record:", verificationError.message);
      }

      // Keep local JSON store in sync for local dev compatibility
      try {
        const db = await readDatabase();

        let localEmployerProfile = db.employerProfiles.find((p) => p.userId === portalUser.id);
        if (!localEmployerProfile) {
          localEmployerProfile = {
            id: employerProfileId,
            userId: portalUser.id,
            companyName: `${portalUser.fullName}'s Business`,
            contactPerson: portalUser.fullName,
            headline: "New employer account",
            location: "Barangay 634",
            verified: false,
            businessType: "Pending business type",
          };
          db.employerProfiles.unshift(localEmployerProfile);
        }

        const post: JobPost = {
          id: postId,
          createdAt: now,
          employerId: employerProfileId,
          title: data.title,
          position: data.position,
          postType: data.postType,
          status: "pending",
          qualifications: data.qualifications,
          requirements: Array.isArray(data.adminRequirements)
            ? data.adminRequirements.join(", ")
            : data.adminRequirements || "",
          description: data.description ?? "",
          employmentType: "Full-time",
          schedule: "Flexible",
          salary: "Competitive",
          urgency: "normal",
          benefits: ["Community-based employment", "Local support"],
          employerRequirements,
          adminRequirements,
          postingStartDate,
          postingEndDate,
          shifts,
          pwdFriendly,
          seniorFriendly,
          accessibilityFeatures,
        };

        db.jobPosts.unshift(post);
        db.verifications.unshift({
          id: verificationId,
          type: "Employer Verification",
          subjectName: `Job Post: ${post.title}`,
          status: "pending",
          submittedAt: now,
        });
        appendAuditLog(db, {
          actor: localEmployerProfile.contactPerson ?? "Employer",
          action: "submitted job post for review",
          target: post.title,
        });
        await writeDatabase(db, true);
      } catch (syncError: any) {
        console.warn("JSON store sync warning (non-critical):", syncError?.message);
      }

      return NextResponse.json({ post: insertedPost });
    } catch (error: any) {
      const message = error?.message ?? String(error);
      console.error("[job-posts] Supabase admin job-posts failed; NOT saving to JSON", {
        message,
        name: error?.name,
      });

      return NextResponse.json(
        {
          error: "Supabase job post create failed",
          message,
        },
        { status: 500 }
      );
    }
  }


  // Fallback to JSON store (either Supabase not configured or failed)
  console.log("Using JSON store fallback for job post creation");

  const db = await readDatabase();
  let employerProfile = db.employerProfiles.find((p) => p.userId === portalUser.id);

  if (!employerProfile) {
    employerProfile = {
      id: makeId("employer"),
      userId: portalUser.id,
      companyName: `${portalUser.fullName}'s Business`,
      contactPerson: portalUser.fullName,
      headline: "New employer account",
      location: "Barangay 634",
      verified: false,
      businessType: "Pending business type",
    };
    db.employerProfiles.unshift(employerProfile);
  }

  if (!employerProfile) {
    employerProfile = {
      id: makeId("employer"),
      userId: portalUser.id,
      companyName: `${portalUser.fullName}'s Business`,
      contactPerson: portalUser.fullName,
      headline: "New employer account",
      location: "Barangay 634",
      verified: false,
      businessType: "Pending business type",
    };
    db.employerProfiles.unshift(employerProfile);
  }

  const {
    employerRequirements,
    adminRequirements,
    postingStartDate,
    postingEndDate,
    shifts,
    pwdFriendly,
    seniorFriendly,
    accessibilityFeatures,
  } = buildJobPostFields(data);

  const postData: Omit<JobPost, "id" | "createdAt" | "employerId"> = {
    title: data.title,
    position: data.position,
    postType: data.postType,
    status: "pending",
    qualifications: data.qualifications,
    requirements: adminRequirements.join(", "),
    description: data.description ?? "",
    employmentType: "Full-time",
    schedule: "Flexible",
    salary: "Competitive",
    urgency: "normal",
    benefits: ["Community-based employment", "Local support"],
    employerRequirements,
    adminRequirements,
    postingStartDate,
    postingEndDate,
    shifts,
    pwdFriendly,
    seniorFriendly,
    accessibilityFeatures,
  };

  const { createJobPost } = await import("@/lib/backend/store");
  const post = createJobPost(db, employerProfile.id, postData);
  console.log("Created job post:", { id: post.id, title: post.title, employerId: post.employerId });

  try {
    await writeDatabase(db, true);
    console.log("Successfully wrote job post to database");
  } catch (error: any) {
    console.error("Failed to persist job post:", error?.message ?? error);
    return NextResponse.json({ error: "Failed to save job post" }, { status: 500 });
  }

  return NextResponse.json({ post });
}

