import LearningProgram from '../models/LearningProgram.js';
import { seedAdmin } from '../seed/seedAdmin.js';
import { seedMous } from '../seed/seedMous.js';
import { seedCSR } from '../seed/seedCSR.js';
import { seedLearning } from '../seed/seedLearning.js';
import { seedBusiness } from '../seed/seedBusiness.js';
import { seedCareers } from '../seed/seedCareers.js';
import { seedContent } from '../seed/seedContent.js';

let bootstrapRan = false;

export async function autoBootstrap() {
  if (bootstrapRan) return;
  bootstrapRan = true;

  try {
    const count = await LearningProgram.countDocuments();
    if (count === 0) {
      console.log('[bootstrap] Initializing database with default CMS data...');
      const admin = await seedAdmin();
      await seedMous(admin);
      await seedCSR(admin);
      await seedLearning(admin);
      await seedBusiness(admin);
      await seedCareers(admin);
      await seedContent(admin);
      console.log('[bootstrap] Initialization complete.');
    }
  } catch (err) {
    console.warn('[bootstrap] Auto-bootstrap deferred:', err.message);
  }
}

export default autoBootstrap;
