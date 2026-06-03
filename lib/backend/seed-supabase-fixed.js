const { readDatabase } = require('./store.js');
const { supabaseAdmin } = require('../../lib/supabase-server.js');

async function seedSupabase() {
  const supabase = supabaseAdmin;
  if (!supabase) {
    console.error("SUPABASE_SERVICE_ROLE_KEY not set!");
    process.exit(1);
  }

  console.log("Reading local data...");
  const db = await readDatabase();

  console.log("Seeding Supabase...");
  try {
    // Safe upsert - won't duplicate
    if (db.users && db.users.length > 0) {
      await supabase.from('users').upsert(db.users.map(user => ({
        id: user.id,
        role: user.role,
        full_name: user.fullName,
        email: user.email,
        phone: user.phone || '',
        status: user.status,
        created_at: user.createdAt
      })), { onConflict: 'email' });
      console.log(`✅ Seeded ${db.users.length} users`);
    }

    if (db.employerProfiles && db.employerProfiles.length > 0) {
      await supabase.from('employer_profiles').upsert(db.employerProfiles.map(profile => ({
        id: profile.id,
        user_id: profile.userId,
        company_name: profile.companyName,
        contact_person: profile.contactPerson,
        headline: profile.headline,
        location: profile.location,
        verified: profile.verified,
        business_type: profile.businessType
      })), { onConflict: 'id' });
      console.log(`✅ Seeded ${db.employerProfiles.length} employer profiles`);
    }

    if (db.jobPosts && db.jobPosts.length > 0) {
      await supabase.from('job_posts').upsert(db.jobPosts.map(post => ({
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
      })), { onConflict: 'id' });
      console.log(`✅ Seeded ${db.jobPosts.length} job posts`);
    }

    if (db.applications && db.applications.length > 0) {
      await supabase.from('applications').upsert(db.applications.map(app => ({
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
      })), { onConflict: 'id' });
      console.log(`✅ Seeded ${db.applications.length} applications`);
    }

    console.log("🎉 ALL DATA SYNCED TO SUPABASE - DEPLOYED SITE WILL SHOW DATA!");
  } catch (error) {
    console.error("Seed failed:", error);
  }
}

seedSupabase();

