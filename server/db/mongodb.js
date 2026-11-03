import dns from 'node:dns';
import { MongoClient } from 'mongodb';

// Ensure public DNS fallback for SRV resolution
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Use OS DNS
}

const DEFAULT_URI = 'mongodb+srv://qaroo_app_user:qaroo%402026@qaroo-cluster.aiyod6e.mongodb.net/qaroo_cms?retryWrites=true&w=majority';
export const MONGODB_URI = process.env.MONGODB_URI || process.env.ATLAS_URI || DEFAULT_URI;

export const COLLECTION_MAP = {
  contact_messages: 'contactmessages',
  contactmessages: 'contactmessages',
  job_applications: 'jobapplications',
  jobapplications: 'jobapplications',
  business_solutions: 'businesssolutions',
  businesssolutions: 'businesssolutions',
  learning_programs: 'learningprograms',
  learningprograms: 'learningprograms',
  csr_projects: 'csrprojects',
  csrprojects: 'csrprojects',
  page_contents: 'pagecontents',
  pagecontents: 'pagecontents',
  job_postings: 'jobpostings',
  jobpostings: 'jobpostings',
  resume_files: 'resumefiles',
  resumefiles: 'resumefiles',
  client_errors: 'clienterrors',
  clienterrors: 'clienterrors',
  admins: 'admins',
  mous: 'mous',
};

let cachedClient = null;
let clientPromise = null;

export async function getMongoClient() {
  if (cachedClient) return cachedClient;
  if (clientPromise) return clientPromise;

  clientPromise = (async () => {
    try {
      const client = new MongoClient(MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000,
        maxPoolSize: 10,
      });
      await client.connect();
      cachedClient = client;
      return cachedClient;
    } catch (err) {
      console.warn('[MongoDB] Connection deferred:', err.message);
      clientPromise = null;
      return null;
    }
  })();

  return clientPromise;
}

export async function getMongoDb(dbName = 'qaroo_cms') {
  const client = await getMongoClient();
  return client ? client.db(dbName) : null;
}

export async function getMongoCollection(name) {
  const db = await getMongoDb();
  if (!db) return null;
  const mapped = COLLECTION_MAP[name.toLowerCase()] || name;
  return db.collection(mapped);
}

export default getMongoDb;
