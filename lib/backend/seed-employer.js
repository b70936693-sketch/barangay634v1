import { supabaseAdmin } from '@/lib/supabase-server';
import { makeId } from './store';
import { readDatabase, writeDatabase } from './store';

async function seedEmployerData() {
  const db = await readDatabase();

  // Sample employer user
  const employerUserId = makeId('user');
  const employerUser = {
    id: employerUserId,
    role: 'employer',
    fullName: 'Barangay Employer 1',
    email: 'employer1@barangay634.local',
    phone: '0917-123-4567',
    status: 'verified',
    createdAt: new Date().toISOString(),
  };

  // Sample employer profile
  const employerProfileId = makeId('employer');
  const employerProfile = {
    id: employerProfileId,
    userId: employerUserId,
    companyName: 'Barangay Store',
    contactPerson: 'Barangay Employer 1',
    headline: 'Local retail business',
    location: 'Barangay 634',
    verified: true,
    businessType: 'Retail',
  };

  // Sample job posts
  const job1 = {
    id: makeId('job'),
    employerId: employerProfileId,
    title: 'Hiring Cashier - Urgent',
    position: 'Cashier',
    postType: 'establishment_job',
    createdAt: new Date(Date.now() - 3*24*60*60*1000).toISOString(), // 3 days ago
    status: 'active',
    qualifications: 'HS graduate, basic math',
    requirements: 'Resume, ID',
    description: 'Full time cashier position',
    employmentType: 'Full-time',
    schedule: '8AM-5PM',
    salary: '12k',
    urgency: 'urgent',
    benefits: ['SSS', '13th month'],
    employerRequirements: ['Resume'],
    adminRequirements: ['Barangay clearance'],
  };

  const job2 = {
    id: makeId('job'),
    employerId: employerProfileId,
    title: 'Delivery Rider Needed',
    position: 'Delivery Rider',
    postType: 'establishment_job',
    createdAt: new Date().toISOString(),
    status: 'pending',
    qualifications: 'Has motorcycle license',
    requirements: 'License, helmet',
    description: 'Part time delivery',
    employmentType: 'Part-time',
    schedule: 'Flexible',
    salary: 'Daily rate',
    urgency: 'normal',
    benefits: [],
    employerRequirements: ['License copy'],
    adminRequirements: ['Valid ID'],
  };

  // Sample applications
  const applicantId1 = makeId('applicant');
  const application1 = {
    id: makeId('app'),
    jobPostId: job1.id,
    applicantId: applicantId1,
    fullName: 'Juan Dela Cruz',
    email: 'juan@barangay634.local',
    contact: '0917-111-2222',
    position: 'Cashier',
    appliedDate: new Date().toISOString(),
    status: 'pending',
    availability: 'Full time',
    shiftPreference: 'Morning',
    introduction: 'Experienced cashier looking for stable job.',
    documents: [{ id: 'doc1', name: 'Resume.pdf' }],
  };

  db.users.push(employerUser);
  db.employerProfiles.push(employerProfile);
  db.jobPosts.push(job1, job2);
  db.applications.push(application1);

  await writeDatabase(db);

  console.log('✅ Seeded employer data: User', employerUserId, 'Profile', employerProfileId, 'Jobs:', job1.id, job2.id);
}

seedEmployerData().catch(console.error);

