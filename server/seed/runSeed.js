import 'dotenv/config';
import { seedAdmin } from './seedAdmin.js';
import { seedMous } from './seedMous.js';
import { seedCSR } from './seedCSR.js';
import { seedLearning } from './seedLearning.js';
import { seedBusiness } from './seedBusiness.js';
import { seedCareers } from './seedCareers.js';
import { seedContent } from './seedContent.js';

async function run() {
  console.log('Seeding Firebase Firestore...');
  const admin = await seedAdmin();
  await seedMous(admin);
  await seedCSR(admin);
  await seedLearning(admin);
  await seedBusiness(admin);
  await seedCareers(admin);
  await seedContent(admin);
  console.log('\nFirebase seeding complete.');
  process.exit(0);
}

run().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
