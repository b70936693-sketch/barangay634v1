import { NextResponse } from "next/server";
import { requirePortalRole } from "@/lib/backend/auth";
import { getCurrentPortalUser } from "@/lib/backend/auth";
import { supabaseStore, getJobPostApplications } from "@/lib/backend/supabase-store";
import { readDatabase } from "@/lib/backend/store";
import { supabaseAdmin } from "@/lib/supabase-server";



export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requirePortalRole(request, "employer");
  if (!user) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { portalUser } = await getCurrentPortalUser(request);
  if (!portalUser || !portalUser.role || portalUser.role !== 'employer') {
    return NextResponse.json({ error: "Employer profile not found" }, { status: 404 });
  }

  const { data: employerProfile, error: employerProfileError } = await supabaseStore!
    .from('employer_profiles')
    .select('id, user_id')
    .eq('user_id', portalUser.id)
    .maybeSingle();

  if (employerProfileError || !employerProfile?.id) {
    return NextResponse.json(
      { error: "Employer profile not found", employerProfileError, portalUserId: portalUser.id },
      { status: 404 }
    );
  }

  const employerProfileId = employerProfile.id;
  const employerUserId = (employerProfile as any).user_id as string | undefined;


  const { data: jobPost, error: jobError } = await supabaseStore!
    .from('job_posts')
    .select('employer_id')
    .eq('id', params.id)
    .single();

  const employerIdOnJobPost = (jobPost as any)?.employer_id;

  // Some schemas store job_posts.employer_id pointing to employer_profiles.id,
  // others point to employer_profiles.user_id. Allow both to prevent false 403s.
  const isAuthorized =
    !jobError &&
    !!jobPost &&
    (employerIdOnJobPost === employerProfileId || employerIdOnJobPost === employerUserId);

  if (!isAuthorized) {
    return NextResponse.json(
      {
        error: "Job post not found or unauthorized",
        debug: {
          portalUserId: portalUser.id,
          employerProfile: employerProfile,
          jobPostId: params.id,
          employerIdOnJobPost,
          expectedEmployerProfileId: employerProfileId,
          expectedEmployerUserId: employerUserId,
        },
      },
      { status: 403 }
    );
  }




  // Fetch applications.
  // If Supabase reads are available, use them.
  // Otherwise, fall back to the JSON store (applicants submission writes to JSON).
  try {
    if (supabaseAdmin) {
      const { data: apps, error: appError } = await getJobPostApplications(params.id) as any;

      if (appError) {
        console.error("Supabase error:", appError);
      } else if (Array.isArray(apps)) {
        return NextResponse.json({ applications: apps || [] });
      }
    }
  } catch (e) {
    console.warn("Supabase applicants fetch failed, using JSON fallback:", e);
  }

  const db = await readDatabase();
  const employerJobPostIds: string[] = db.jobPosts
    .filter((p: any) => p.employerId === employerProfileId)
    .map((p: any) => p.id);

  const appsFromJson = db.applications
    .filter((app: any) => app.jobPostId === params.id && employerJobPostIds.includes(app.jobPostId))
    .map((app: any) => ({
      ...app,
      appliedDate: app.appliedDate,
    }));


  return NextResponse.json({ applications: appsFromJson || [] });



}


