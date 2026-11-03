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
    let admin = null;
    try {
      admin = await seedAdmin();
    } catch (e) {
      console.warn('[bootstrap] seedAdmin deferred:', e.message);
    }

    // On Vercel serverless, models are already pre-populated in memory with full default CMS data.
    // Heavy batch seeding over gRPC on cold start would exceed the 10s invocation limit.
    if (!process.env.VERCEL) {
      try { await seedMous(admin); } catch (e) { console.warn('[bootstrap] seedMous error:', e.message); }
      try { await seedCSR(admin); } catch (e) { console.warn('[bootstrap] seedCSR error:', e.message); }
      try { await seedLearning(admin); } catch (e) { console.warn('[bootstrap] seedLearning error:', e.message); }
      try { await seedBusiness(admin); } catch (e) { console.warn('[bootstrap] seedBusiness error:', e.message); }
      try { await seedCareers(admin); } catch (e) { console.warn('[bootstrap] seedCareers error:', e.message); }
      try { await seedContent(admin); } catch (e) { console.warn('[bootstrap] seedContent error:', e.message); }
    }
  } catch (err) {
    console.warn('[bootstrap] Auto-bootstrap deferred:', err.message);
  }
}

export default autoBootstrap;
