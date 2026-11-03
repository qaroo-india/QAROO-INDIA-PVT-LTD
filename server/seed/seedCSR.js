import CSRProject from '../models/CSRProject.js';
import { CSR_PROJECTS } from '../data/seedData.js';

export async function seedCSR(admin) {
  const existing = await CSRProject.countDocuments();
  if (existing > 0) {
    console.log(`${existing} CSR projects already exist - skipping CSR seeding.`);
    return;
  }

  const docs = [];
  Object.entries(CSR_PROJECTS).forEach(([year, projects]) => {
    projects.forEach((p) => {
      docs.push({
        ...p,
        year,
        status: 'published',
        createdBy: admin ? admin._id : null,
        updatedBy: admin ? admin._id : null,
      });
    });
  });

  await CSRProject.insertMany(docs);
  console.log(`Seeded ${docs.length} CSR projects.`);
}
