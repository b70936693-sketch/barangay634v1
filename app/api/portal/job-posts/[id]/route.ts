import { NextRequest, NextResponse } from "next/server";

import { getCurrentPortalUser } from "@/lib/backend/auth";
import { getOrCreateEmployerProfile, readDatabase, writeDatabase } from "@/lib/backend/store";
import { supabaseAdmin } from "@/lib/supabase-server";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { portalUser } = await getCurrentPortalUser(request);
  const { id } = await params;

  console.log('GET /api/portal/job-posts/' + id, { portalUser: portalUser?.email || 'no user', portalUserId: portalUser?.id });
  
  
  if (!portalUser || portalUser.role !== "employer") {
    console.log('GET Forbidden - role:', portalUser?.role);
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }


  // NOTE: Ownership check below can 403 with "Not your job post" even when the employer is logged in,
  // if the resolved employer_profile id does not match job_posts.employer_id.
  // We keep this explicit for debugging. 


  // Try Supabase first
  const admin = supabaseAdmin;
  if (admin) {
    const adminAny = admin as any;
    // Find employer profile
    let employerProfile: any = null;

    const queryEmployerProfileByUserId = async (userId: string) => {
      // Compatibility: some deployments use `user_id`, others `userId`.
      const cols = ["user_id", "userId"] as const;
      let lastError: any = null;

      for (const col of cols) {
        const { data, error } = await adminAny
          .from('employer_profiles')
          .select('id')
          .eq(col as any, userId)
          .maybeSingle();

        if (data) {
          return { data, error: null } as any;
        }

        if (error) {
          const msg = error?.message ? String(error.message) : String(error);
          lastError = error;

          if (msg.includes('does not exist') || msg.includes('column')) {
            continue;
          }

          return { data: null, error } as any;
        }
      }

      return { data: null, error: lastError } as any;
    };

    const { data: foundEmployerProfile, error: profileError } = await queryEmployerProfileByUserId(portalUser.id);


    console.log('Supabase employer_profiles lookup result:', { found: !!foundEmployerProfile, profileError: profileError?.message ?? null });

    employerProfile = foundEmployerProfile;

    if (profileError || !employerProfile) {
      console.log('Employer profile not found in Supabase - creating (fallback)');

      // Create employer profile in the supabase-backed data store (JSON->Supabase sync)

      // so employer/job ownership checks can proceed.
      const db = await readDatabase();
      const created = await getOrCreateEmployerProfile(db, portalUser.id, admin);
      console.log('getOrCreateEmployerProfile returned:', { createdId: created?.id });

      if (!created?.id) {
        console.error('Auto-create returned no id:', created);
        return NextResponse.json({ error: "Employer profile not found and auto-create failed", debug: { created } }, { status: 404 });
      }

      // Re-check in Supabase so we have the canonical id.
      const { data: rechecked, error: recheckError } = await queryEmployerProfileByUserId(portalUser.id);


      console.log('Supabase re-check after auto-create:', { rechecked: !!rechecked, recheckError: recheckError?.message ?? null });

      if (recheckError || !rechecked) {
        console.error('Employer profile auto-create failed in Supabase (recheck):', recheckError?.message ?? recheckError, { created });
        return NextResponse.json({ error: "Employer profile not found", debug: { created, recheckError: recheckError?.message ?? recheckError } }, { status: 404 });
      }

      const recheckedEmployerProfile = rechecked as any;
      employerProfile = recheckedEmployerProfile.id ? recheckedEmployerProfile : employerProfile;
    }


    // Find job post
    const { data: jobPost, error: postError } = await adminAny
      .from('job_posts')
      .select('*')
      .eq('id', id)
      .single();

    if (postError || !jobPost) {
      console.log('Job post not found in Supabase');
      return NextResponse.json({ error: "Job post not found" }, { status: 404 });
    }

    if ((jobPost.employer_id ?? jobPost.employerId) !== employerProfile.id) {

      // Normalize for Prisma vs Supabase naming:
      // Prisma uses `employerId`, while Supabase often exposes snake_case columns.
      const jobPostEmployerId = jobPost.employer_id ?? jobPost.employerId;
      if (jobPostEmployerId !== employerProfile.id) {
        console.error('[OwnershipCheck:GET] Not your job post', {
          jobPostId: id,
          jobPostEmployerId: jobPostEmployerId,
          resolvedEmployerProfile: {
            id: employerProfile?.id,
            userId: employerProfile?.user_id ?? employerProfile?.userId ?? null,
          },
          portalUser: {
            id: portalUser?.id,
            email: portalUser?.email,
            role: portalUser?.role,
          },
        });
        console.log('Ownership fail:', jobPostEmployerId, '!=', employerProfile.id);
        return NextResponse.json({ error: "Not your job post" }, { status: 403 });
      }
    }



    return NextResponse.json({ jobPost });
  }

  // Fallback to JSON store
  const db = await readDatabase();
  const jobPost = db.jobPosts.find((post) => post.id === id);
  if (!jobPost) {
    console.log('Job post not found in DB');
    return NextResponse.json({ error: "Job post not found" }, { status: 404 });
  }

  // getOrCreateEmployerProfile expects a supabase client, but in fallback mode we use the JSON store only.
  const employerProfile = await getOrCreateEmployerProfile(db, portalUser.id, null);
  console.log('Employer profile found:', employerProfile.id);

  if (jobPost.employerId !== employerProfile.id) {
    console.log('Ownership fail:', jobPost.employerId, '!=', employerProfile.id);
    return NextResponse.json({ error: "Not your job post" }, { status: 403 });
  }


  return NextResponse.json({ jobPost });
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { portalUser } = await getCurrentPortalUser(request);
  const { id } = await params;

  console.log('PATCH /api/portal/job-posts/' + id, { portalUser: portalUser?.email || 'no user', portalUserId: portalUser?.id });
  
  if (!portalUser || portalUser.role !== "employer") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  console.log('PATCH body:', body);
  const data = body.data || body;

  // Try Supabase first
  const admin = supabaseAdmin;
  if (admin) {
    const adminAny = admin as any;
    // Find employer profile
    let employerProfile: any = null;

    const queryEmployerProfileByUserId = async (userId: string) => {
      const cols = ["user_id", "userId"] as const;
      let lastError: any = null;

      for (const col of cols) {
        const { data, error } = await adminAny
          .from('employer_profiles')
          .select('id')
          .eq(col as any, userId)
          .maybeSingle();

        if (data) {
          return { data, error: null } as any;
        }

        if (error) {
          const msg = error?.message ? String(error.message) : String(error);
          lastError = error;

          if (msg.includes('does not exist') || msg.includes('column')) {
            continue;
          }

          return { data: null, error } as any;
        }
      }

      return { data: null, error: lastError } as any;
    };

    const { data: foundEmployerProfile, error: profileError } = await queryEmployerProfileByUserId(portalUser.id);
    employerProfile = foundEmployerProfile;

    if (profileError || !employerProfile) {


      console.log('PATCH: Employer profile not found in Supabase - creating (fallback)');

      const db = await readDatabase();
      const created = await getOrCreateEmployerProfile(db, portalUser.id, admin);

      if (!created?.id) {
        return NextResponse.json({ error: "Employer profile not found and auto-create failed" }, { status: 404 });
      }

      const { data: rechecked, error: recheckError } = await queryEmployerProfileByUserId(portalUser.id);


      if (recheckError || !rechecked) {
        console.log('PATCH: Employer profile auto-create failed in Supabase:', recheckError?.message);
        return NextResponse.json({ error: "Employer profile not found" }, { status: 404 });
      }

      const recheckedEmployerProfile = rechecked as any;
      employerProfile = recheckedEmployerProfile?.id ? recheckedEmployerProfile : employerProfile;

    }


    // Find job post and verify ownership
    const { data: existingPost, error: postError } = await adminAny
      .from('job_posts')
      .select('employer_id, status')
      .eq('id', id)
      .single();

    if (postError || !existingPost) {
      return NextResponse.json({ error: "Job post not found" }, { status: 404 });
    }

    if (existingPost.employer_id !== employerProfile.id) {
      return NextResponse.json({ error: "Not your post" }, { status: 403 });
    }

    if (data.status === "active") {
      return NextResponse.json({ error: "Only admins can approve job posts" }, { status: 403 });
    }

    const contentFields = [
      "title",
      "position",
      "postType",
      "qualifications",
      "requirements",
      "description",
      "employmentType",
      "schedule",
      "salary",
      "urgency",
      "benefits",
      "employerRequirements",
      "adminRequirements",
    ] as const;
    const hasContentUpdate = contentFields.some((field) => data[field] !== undefined);
    const shouldResubmitForReview =
      hasContentUpdate && (existingPost.status === "rejected" || existingPost.status === "closed");

    // Build update payload - map camelCase to snake_case for Supabase
    const updatePayload: Record<string, any> = {};
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.position !== undefined) updatePayload.position = data.position;
    if (data.postType !== undefined) updatePayload.post_type = data.postType;
    if (data.status !== undefined && data.status !== "active") updatePayload.status = data.status;
    if (shouldResubmitForReview) {
      updatePayload.status = "pending";
      updatePayload.rejection_notes = null;
      updatePayload.published_at = null;
    }
    if (data.qualifications !== undefined) updatePayload.qualifications = data.qualifications;
    if (data.requirements !== undefined) updatePayload.requirements = data.requirements;
    if (data.description !== undefined) updatePayload.description = data.description;
    if (data.employmentType !== undefined) updatePayload.employment_type = data.employmentType;
    if (data.schedule !== undefined) updatePayload.schedule = data.schedule;
    if (data.salary !== undefined) updatePayload.salary = data.salary;
    if (data.urgency !== undefined) updatePayload.urgency = data.urgency;
    if (data.benefits !== undefined) updatePayload.benefits = data.benefits;
    if (data.employerRequirements !== undefined) updatePayload.employer_requirements = data.employerRequirements;
    if (data.adminRequirements !== undefined) updatePayload.admin_requirements = data.adminRequirements;

    const { data: updatedPost, error: updateError } = await adminAny
      .from('job_posts')
      .update(updatePayload)
      .eq('id', id)
      .select()
      .single();


    if (updateError) {
      console.error('Failed to update job post in Supabase:', updateError);
      return NextResponse.json({ error: updateError.message || 'Failed to update job post' }, { status: 500 });
    }

    // Sync to JSON store for local dev compatibility
    try {
      const db = await readDatabase();
      const localJobPost = db.jobPosts.find((post) => post.id === id);
      if (localJobPost) {
        Object.assign(localJobPost, data);
        await writeDatabase(db, true);
      }
    } catch (syncError: any) {
      console.warn('JSON store sync warning (non-critical):', syncError?.message);
    }

    return NextResponse.json({ jobPost: updatedPost });
  }

  // Fallback to JSON store
  const db = await readDatabase();
  const jobPost = db.jobPosts.find((post) => post.id === id);
  if (!jobPost) {
    return NextResponse.json({ error: "Job post not found" }, { status: 404 });
  }

  const employerProfile = await getOrCreateEmployerProfile(db, portalUser.id, null);

  if (jobPost.employerId !== employerProfile.id) {
    return NextResponse.json({ error: "Not your post" }, { status: 403 });
  }

  if (data.status === "active") {
    return NextResponse.json({ error: "Only admins can approve job posts" }, { status: 403 });
  }

  const contentFields = [
    "title",
    "position",
    "postType",
    "qualifications",
    "requirements",
    "description",
    "employmentType",
    "schedule",
    "salary",
    "urgency",
    "benefits",
    "employerRequirements",
    "adminRequirements",
  ] as const;
  const hasContentUpdate = contentFields.some((field) => data[field] !== undefined);
  const shouldResubmitForReview =
    hasContentUpdate && (jobPost.status === "rejected" || jobPost.status === "closed");

  const { status: requestedStatus, ...contentUpdates } = data;
  Object.assign(jobPost, contentUpdates);

  if (requestedStatus !== undefined && requestedStatus !== "active") {
    jobPost.status = requestedStatus;
  }

  if (shouldResubmitForReview) {
    jobPost.status = "pending";
    jobPost.rejectionNotes = "";
    jobPost.publishedAt = null;
  }

  await writeDatabase(db, true);

  return NextResponse.json({ jobPost });
}
 