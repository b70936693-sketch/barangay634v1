import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'node:path'
import { readFile } from 'node:fs/promises'
import type { PortalDatabase, UserRecord, EmployerProfile, ApplicantProfile, JobPost, ApplicationRecord, InterviewRecord, VerificationRecord } from './types'

// Load env first
dotenv.config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('🚨 MISSING SUPABASE ENV VARS 🚨')
  console.error('- NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl ? '✅' : '❌ MISSING')
  console.error('- SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey ? '✅' : '❌ MISSING')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function main() {
  console.log('🔄 Loading data/portal-db.json...')
  const dbPath = path.join(process.cwd(), 'data/portal-db.json')
  const raw = await readFile(dbPath, 'utf8')
  const db: PortalDatabase = JSON.parse(raw)

  console.log('📊 Data loaded:', {
    users: db.users.length,
    employerProfiles: db.employerProfiles.length,
    applicantProfiles: db.applicantProfiles.length,
    jobPosts: db.jobPosts.length,
    applications: db.applications.length,
    verifications: db.verifications.length
  })

  // Upsert users
  if (db.users.length > 0) {
    await supabase.from('users').upsert(db.users.map(toSupabaseUser), { onConflict: 'email' })
    console.log(`✅ Seeded ${db.users.length} users`)
  }

  // Upsert employer_profiles
  if (db.employerProfiles.length > 0) {
    await supabase.from('employer_profiles').upsert(db.employerProfiles.map(toSupabaseEmployer), { onConflict: 'id' })
    console.log(`✅ Seeded ${db.employerProfiles.length} employer profiles`)
  }

  // Upsert applicant_profiles
  if (db.applicantProfiles.length > 0) {
    await supabase.from('applicant_profiles').upsert(db.applicantProfiles.map(toSupabaseApplicant), { onConflict: 'id' })
    console.log(`✅ Seeded ${db.applicantProfiles.length} applicant profiles`)
  }

  // Upsert job_posts
  if (db.jobPosts.length > 0) {
    await supabase.from('job_posts').upsert(db.jobPosts.map(toSupabaseJobPost), { onConflict: 'id' })
    console.log(`✅ Seeded ${db.jobPosts.length} job posts`)
  }

  // Upsert applications
  if (db.applications.length > 0) {
    await supabase.from('applications').upsert(db.applications.map(toSupabaseApplication), { onConflict: 'id' })
    console.log(`✅ Seeded ${db.applications.length} applications`)
  }

  // Upsert interviews
  if (db.interviews.length > 0) {
    await supabase.from('interviews').upsert(db.interviews, { onConflict: 'id' })
    console.log(`✅ Seeded ${db.interviews.length} interviews`)
  }

  // Upsert verifications
  if (db.verifications.length > 0) {
    await supabase.from('verifications').upsert(db.verifications.map(toSupabaseVerification), { onConflict: 'id' })
    console.log(`✅ Seeded ${db.verifications.length} verifications`)
  }

  console.log('🎉 ALL DATA SYNCED TO SUPABASE!')
}

function toSupabaseUser(user: UserRecord) {
  return {
    id: user.id,
    role: user.role,
    full_name: user.fullName,
    email: user.email,
    phone: user.phone || '',
    status: user.status,
    created_at: user.createdAt
  }
}

function toSupabaseEmployer(profile: EmployerProfile) {
  return {
    id: profile.id,
    user_id: profile.userId,
    company_name: profile.companyName,
    contact_person: profile.contactPerson,
    headline: profile.headline,
    location: profile.location,
    verified: profile.verified,
    business_type: profile.businessType
  }
}

function toSupabaseApplicant(profile: ApplicantProfile) {
  return {
    id: profile.id,
    user_id: profile.userId,
    full_name: profile.fullName,
    preferred_name: profile.preferredName,
    email: profile.email,
    phone: profile.phone,
    barangay: profile.barangay,
    address: profile.address,
    headline: profile.headline,
    bio: profile.bio,
    skills: profile.skills,
    documents_ready: profile.documentsReady
  }
}

function toSupabaseJobPost(post: JobPost) {
  return {
    id: post.id,
    employer_id: post.employerId,
    title: post.title,
    position: post.position,
    post_type: post.postType,
    status: post.status,
    qualifications: post.qualifications,
    requirements: post.requirements,
    description: post.description,
    employment_type: post.employmentType,
    schedule: post.schedule,
    salary: post.salary,
    urgency: post.urgency,
    benefits: post.benefits,
    employer_requirements: post.employerRequirements,
    admin_requirements: post.adminRequirements,
    created_at: post.createdAt
  }
}

function toSupabaseApplication(app: ApplicationRecord) {
  return {
    id: app.id,
    job_post_id: app.jobPostId,
    applicant_id: app.applicantId,
    full_name: app.fullName,
    email: app.email,
    contact: app.contact,
    position: app.position,
    applied_date: app.appliedDate,
    status: app.status,
    availability: app.availability,
    shift_preference: app.shiftPreference,
    introduction: app.introduction,
    documents: app.documents
  }
}

function toSupabaseVerification(v: VerificationRecord) {
  return {
    id: v.id,
    type: v.type,
    subject_name: v.subjectName,
    status: v.status,
    submitted_at: v.submittedAt,
    email: v.email,
    documents: v.documents,
    notes: v.notes,
    invite_token: v.inviteToken,
    invite_sent_at: v.inviteSentAt,
    approved_at: v.approvedAt,
    rejected_at: v.rejectedAt
  }
}

main().catch(console.error)

