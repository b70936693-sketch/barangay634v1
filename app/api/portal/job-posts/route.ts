import { NextResponse } from "next/server";

import { getCurrentPortalUser } from "@/lib/backend/auth";
import { getOrCreateEmployerProfile, makeId, readDatabase, writeDatabase } from "@/lib/backend/store";
import { supabaseAdmin } from "@/lib/supabase-server";

import type { JobPost } from "@/lib/backend/types";

export async function GET(request: Request) {
  const { portalUser } = await getCurrentPortalUser(request);
  if (!portalUser || portalUser.role !== "employer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const db = await readDatabase();
  const employerProfile =
    db.employerProfiles.find((p) => p.userId === portalUser.id) ||
    (await getOrCreateEmployerProfile(db, portalUser.id, null));
  const jobPosts = db.jobPosts.filter((post) => post.employerId === employerProfile.id);
  return NextResponse.json({ jobPosts });
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
    try {
      // Try to find existing employer profile in Supabase
      const { data: existingProfile, error: profileError } = await supabaseAdmin
        .from("employer_profiles")
        .select("id")
        .eq("user_id", portalUser.id)
        .single();

      if (existingProfile && !profileError) {
        employerProfileId = existingProfile.id;
      } else {
        // Create new employer profile in Supabase
        employerProfileId = makeId("employer");
        const newProfile = {
          id: employerProfileId,
          user_id: portalUser.id,
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

      const employerRequirements = Array.isArray(data.employerRequirements)
        ? data.employerRequirements
        : data.employerRequirements
          ? data.employerRequirements
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [];

      const adminRequirements = Array.isArray(data.adminRequirements)
        ? data.adminRequirements
        : data.adminRequirements
          ? data.adminRequirements
              .split(",")
              .map((s: string) => s.trim())
              .filter(Boolean)
          : [];

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

      // Prevent duplicates: if an identical ACTIVE job post already exists for this employer, return it.
      const { data: existingActivePosts, error: existingQueryError } = await supabaseAdmin
        .from("job_posts")
        .select("*")
        .eq("employer_id", employerProfileId)
        .eq("status", "active");

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
          employerRequirements: employerRequirements,
          adminRequirements: adminRequirements,
        };

        db.jobPosts.unshift(post);
        await writeDatabase(db, true);
      } catch (syncError: any) {
        console.warn("JSON store sync warning (non-critical):", syncError?.message);
      }

      return NextResponse.json({ post: insertedPost });
    } catch (error: any) {
      const message = error?.message ?? String(error);
      console.warn("Supabase admin job-posts failed, falling back to JSON store:", message);
      // Fall through to JSON store fallback
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

  const postData: Omit<JobPost, "id" | "createdAt" | "employerId"> = {
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
    employerRequirements: Array.isArray(data.employerRequirements) ? data.employerRequirements : [],
    adminRequirements: Array.isArray(data.adminRequirements) ? data.adminRequirements : [],
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

