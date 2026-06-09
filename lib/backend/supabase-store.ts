import { supabaseAdmin } from '@/lib/supabase-server'
import type { Database } from '@/types/database'


export const supabaseStore = supabaseAdmin!




// Uses service role key server-side via env

export async function getJobPostApplications(jobPostId: string) {
  const attempts = ["jobPostId", "job_post_id"] as const;

  for (const column of attempts) {
    const { data, error } = await supabaseStore
      .from("applications")
      .select("*")
      .eq(column, jobPostId)
      .order("applied_date", { ascending: false });

    if (!error) {
      return data || [];
    }
  }

  const { data, error } = await supabaseStore
    .from("applications")
    .select("*")
    .eq("job_post_id", jobPostId);

  if (error) throw error;
  return data || [];
}

export async function getEmployerApplications(employerId: string) {
  const { data, error } = await supabaseStore
    .from('applications')
    .select(`
      *,
      job_posts!inner (
        id,
        title,
        employer_id
      )
    `)
    .eq('job_posts.employer_id', employerId)
    .order('applied_date', { ascending: false })

  if (error) throw error
  return data || []
}

export async function updateApplicationStatus(applicationId: string, status: Database['public']['Tables']['applications']['Row']['status']) {
  const { data, error } = await supabaseStore
    .from('applications')
    .update({ status })
    .eq('id', applicationId)
    .select()
    .single()

  if (error) throw error
  return data
}


export async function createJobPost(input: any) {
  const newPost = {
    title: input.title,
    position: input.position,
    post_type: input.post_type,
    qualifications: input.qualifications,
    employer_requirements: input.employer_requirements,
    admin_requirements: input.admin_requirements,
    description: input.description,
    employment_type: input.employment_type,
    schedule: input.schedule,
    salary: input.salary,
    urgency: input.urgency || 'normal',
    employer_id: input.employer_id,
    status: input.status || 'pending',
    created_at: input.created_at || new Date().toISOString()
  }

  const { data, error } = await supabaseStore
    .from('job_posts')
    .insert(newPost)
    .select()
    .single()

  if (error) throw error

  return data
}

export async function getJobPosts() {
  const { data, error } = await supabaseStore
    .from('job_posts')
    .select(`
      *,
      employer_profiles!job_posts_employer_id_fkey (
        company_name,
        location
      )
    `)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getEmployerJobPosts(employerId: string) {
  const { data, error } = await supabaseStore
    .from('job_posts')
    .select('*')
    .eq('employer_id', employerId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function updateJobPostStatus(jobId: string, status: 'pending' | 'active' | 'closed') {
  const { data, error } = await supabaseStore
    .from('job_posts')
    .update({ status })
    .eq('id', jobId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function createApplication(input: {
  job_post_id: string
  full_name: string
  email: string
  phone: string
  introduction: string
  documents: string[]
  applicant_id?: string
  availability?: string
  shift_preference?: string
}) {
  const newApplication = {
    ...input,
    id: crypto.randomUUID(),
    status: 'pending' as const,
    applied_date: new Date().toISOString()
  }

  const { data, error } = await supabaseStore
    .from('applications')
    .insert(newApplication)
    .select()
    .single()

  if (error) throw error

  // Update job post applicant count
  await supabaseStore
    .from('job_posts')
    .update({ applicant_count: Math.floor(Math.random() * 3) + 1 })
    .eq('id', input.job_post_id)

  return data
}

