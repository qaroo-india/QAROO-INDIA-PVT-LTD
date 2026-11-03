import { FirestoreModel } from '../db/FirestoreModel.js';
import { JOB_POSTINGS } from '../../src/data/careers.js';
import { SITE_URL } from '../config/site.js';

const initialJobs = (JOB_POSTINGS || []).map((j, i) => ({
  id: `job-${j.slug}`,
  _id: `job-${j.slug}`,
  title: j.title,
  pageName: j.pageName || j.title,
  slug: j.slug,
  status: 'published',
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

  createdAt: new Date(),
  updatedAt: new Date(),
}));

const JobPosting = new FirestoreModel('job_postings', {}, initialJobs);
export default JobPosting;
