import { NextResponse } from "next/server";
import { requirePortalRole } from "@/lib/backend/auth";
import { getCurrentPortalUser } from "@/lib/backend/auth";
import { supabaseStore, getJobPostApplications } from "@/lib/backend/supabase-store";


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
    .select('id')
    .eq('user_id', portalUser.id)
    .maybeSingle();

  if (employerProfileError || !employerProfile?.id) {
    return NextResponse.json({ error: "Employer profile not found" }, { status: 404 });
  }

  const employerProfileId = employerProfile.id;

  const { data: jobPost, error: jobError } = await supabaseStore!
    .from('job_posts')
    .select('employer_id')
    .eq('id', params.id)
    .single();

  if (jobError || !jobPost || jobPost.employer_id !== employerProfileId) {
    return NextResponse.json({ error: "Job post not found or unauthorized" }, { status: 403 });
  }

  const { data: apps, error: appError } = await getJobPostApplications(params.id) as any;

  if (appError) {
    console.error("Supabase error:", appError);
    return NextResponse.json({ error: "Failed to fetch applicants" }, { status: 500 });
  }

  return NextResponse.json({ applications: apps || [] });



}

