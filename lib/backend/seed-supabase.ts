import { supabaseAdmin } from "@/lib/supabase-server";
import { readDatabase } from "./store";
import { toDbUser, toDbEmployer, toDbApplicant, toDbJobPost, toDbApplication, toDbInterview, toDbVerification, toDbReport, toDbAlert, toDbAuditLog, toDbService } from "./store";

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
    if (db.users.length > 0) {
      await supabase.from('users').upsert(db.users.map(toDbUser), { onConflict: 'email' });
      console.log(`✅ Seeded ${db.users.length} users`);
    }

    if (db.employerProfiles.length > 0) {
      await supabase.from('employer_profiles').upsert(db.employerProfiles.map(toDbEmployer), { onConflict: 'id' });
      console.log(`✅ Seeded ${db.employerProfiles.length} employer profiles`);
    }

    if (db.applicantProfiles.length > 0) {
      await supabase.from('applicant_profiles').upsert(db.applicantProfiles.map(toDbApplicant), { onConflict: 'id' });
      console.log(`✅ Seeded ${db.applicantProfiles.length} applicant profiles`);
    }

    if (db.jobPosts.length > 0) {
      await supabase.from('job_posts').upsert(db.jobPosts.map(toDbJobPost), { onConflict: 'id' });
      console.log(`✅ Seeded ${db.jobPosts.length} job posts`);
    }

    if (db.applications.length > 0) {
      await supabase.from('applications').upsert(db.applications.map(toDbApplication), { onConflict: 'id' });
      console.log(`✅ Seeded ${db.applications.length} applications`);
    }

    if (db.interviews.length > 0) {
      await supabase.from('interviews').upsert(db.interviews.map(toDbInterview), { onConflict: 'id' });
      console.log(`✅ Seeded ${db.interviews.length} interviews`);
    }

    if (db.verifications.length > 0) {
      await supabase.from('verifications').upsert(db.verifications.map(toDbVerification), { onConflict: 'id' });
      console.log(`✅ Seeded ${db.verifications.length} verifications`);
    }

    console.log("🎉 ALL DATA SYNCED TO SUPABASE!");
  } catch (error) {
    console.error("Seed failed:", error);
  }
}

seedSupabase();

