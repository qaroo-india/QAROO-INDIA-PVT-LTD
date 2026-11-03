import JobPosting from '../models/JobPosting.js';
import PageContent from '../models/PageContent.js';
import { JOB_POSTINGS, CAREERS_PAGE } from '../../src/data/careers.js';
import { SITE_URL } from '../config/site.js';

// Seeds/updates job postings and the shared careers page copy from the content
// source. Slug-based upsert, so it is safe to re-run and never deletes records
// an admin has added. Existing publish state is preserved on update - a
// re-seed must not silently republish a vacancy someone took down.
export async function seedCareers(admin) {
  const docs = JOB_POSTINGS.map((j, i) => ({
    title: j.title,
    pageName: j.pageName || j.title,
    slug: j.slug,
    displayOrder: i + 1,

    jobType: j.jobType || '',
    experience: j.experience || '',
    department: j.department || '',
    location: j.location || 'Coimbatore',
    employmentType: j.employmentType || 'FULL_TIME',
    overview: j.overview || '',

    responsibilities: j.responsibilities || [],
    techStack: j.techStack || [],
    requiredSkills: j.requiredSkills || [],
    preferredSkills: j.preferredSkills || [],
    qualifications: j.qualifications || [],
    trainingAreas: j.trainingAreas || [],
    idealCandidate: j.idealCandidate || [],
    benefits: j.benefits || [],
    knowledgeAreas: j.knowledgeAreas || [],
    note: j.note || '',

    keyword: (j.seoKeywords || [])[0] || '',
    seoTitle: j.seoTitle || '',
    seoDescription: j.seoDescription || '',
    seoKeywords: j.seoKeywords || [],
    ogTitle: j.seoTitle || '',
    ogDescription: j.seoDescription || '',
    ogImage: '',
    canonicalUrl: `${SITE_URL}/careers/${j.slug}`,

    createdBy: admin ? admin._id : null,
    updatedBy: admin ? admin._id : null,
  }));

  for (const doc of docs) {
    const existing = await JobPosting.findOne({ slug: doc.slug });
    if (existing) {
      await JobPosting.updateOne(
        { _id: existing._id },
        {
          $set: {
            ...doc,
            // Keep whatever the admin last chose.
            status: existing.status,
            updatedBy: admin ? admin._id : existing.updatedBy,
          },
        }
      );
      console.log(`Updated job posting "${doc.title}"`);
    } else {
      await JobPosting.create({ ...doc, status: 'published' });
      console.log(`Seeded job posting "${doc.title}"`);
    }
  }

  await PageContent.findOneAndUpdate(
    { page: 'careers' },
    { $set: { data: CAREERS_PAGE, updatedBy: admin ? admin._id : null } },
    { upsert: true, new: true }
  );
  console.log('Seeded careers page content.');

  console.log(`Careers sync complete (${docs.length} postings).`);
}
