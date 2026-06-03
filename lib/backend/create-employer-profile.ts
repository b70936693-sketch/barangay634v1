import { readDatabase, writeDatabase } from './store';
import { makeId } from './store';

async function createEmployerProfile() {
  const db = await readDatabase();
  const employerUser = db.users.find(u => u.email === 'irishsaturinas07@gmail.com');
  if (!employerUser) {
    console.log('Employer user not found');
    return;
  }

  // Check if profile exists
  const existing = db.employerProfiles.find(p => p.userId === employerUser.id);
  if (existing) {
    console.log('Profile already exists');
    return;
  }

  const profile = {
    id: makeId('employer'),
    userId: employerUser.id,
    companyName: `${employerUser.fullName}'s Business`,
    contactPerson: employerUser.fullName,
    headline: 'Local employer account',
    location: 'Barangay 634',
    verified: true,
    businessType: 'Local Business',
  };

  db.employerProfiles.push(profile);
  await writeDatabase(db);
  console.log('Created employer profile:', profile);
}

createEmployerProfile();
