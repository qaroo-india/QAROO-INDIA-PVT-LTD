import 'dotenv/config';
import { connectDB } from '../config/db.js';
import LearningProgram from '../models/LearningProgram.js';

async function run() {
  await connectDB();
  const deleted = await LearningProgram.deleteMany({
    $or: [{ slug: '' }, { slug: null }, { slug: { $exists: false } }],
  });
  console.log(`Deleted ${deleted.deletedCount} empty-slug legacy learning records.`);
  const remaining = await LearningProgram.countDocuments();
  const withSlug = await LearningProgram.countDocuments({ slug: { $ne: '' } });
  console.log(`Remaining total: ${remaining} (${withSlug} with slugs).`);
  await import('mongoose').then(({ default: mongoose }) => mongoose.disconnect());
}

run().catch((err) => {
  console.error('Cleanup failed:', err);
  process.exit(1);
});
