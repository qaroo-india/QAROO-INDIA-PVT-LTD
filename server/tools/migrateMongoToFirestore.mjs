/* global console, process, Buffer, URL */
/**
 * Migration Tool: MongoDB Atlas -> Firebase Cloud Firestore
 *
 * Usage:
 *   node server/tools/migrateMongoToFirestore.mjs "<mongodb_connection_string>"
 */

import 'dotenv/config';
import dns from 'node:dns';
import { MongoClient, ObjectId } from 'mongodb';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import db from '../db/firebase.js';

try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch {
  // Use default OS DNS
}

function normalizeMongoUri(rawUri) {
  let cleaned = rawUri.trim().replace(/^["']|["']$/g, '');

  const match = cleaned.match(/^mongodb(\+srv)?:\/\/([^:]+):(.+)@([^/?#]+)(\/.*)?$/);
  if (match) {
    let user = match[2].replace(/^<|>$/g, '');
    let pass = match[3].replace(/^<|>$/g, '');
    const host = match[4];
    let rest = match[5] || '/qaroo_cms?retryWrites=true&w=majority';
    if (rest === '/' || rest === '') rest = '/qaroo_cms?retryWrites=true&w=majority';

    const encUser = encodeURIComponent(decodeURIComponent(user));
    const encPass = encodeURIComponent(decodeURIComponent(pass));

    return `mongodb${match[1] || ''}://${encUser}:${encPass}@${host}${rest}`;
  }
  return cleaned;
}

const rawInput = process.argv[2] || process.env.MONGODB_URI || process.env.ATLAS_URI;

if (!rawInput) {
  console.error('\n[Error] Please provide your MongoDB Atlas connection string:');
  console.error('Usage: node server/tools/migrateMongoToFirestore.mjs "<mongodb_uri>"\n');
  process.exit(1);
}

const uri = normalizeMongoUri(rawInput);

// Map MongoDB collection names (standard and lowercased) to Firestore collection names
const COLLECTION_MAP = {
  job_postings: 'job_postings',
  jobpostings: 'job_postings',
  learning_programs: 'learning_programs',
  learningprograms: 'learning_programs',
  business_solutions: 'business_solutions',
  businesssolutions: 'business_solutions',
  mous: 'mous',
  csr_projects: 'csr_projects',
  csrprojects: 'csr_projects',
  page_contents: 'page_contents',
  pagecontents: 'page_contents',
  admins: 'admins',
  job_applications: 'job_applications',
  jobapplications: 'job_applications',
  contact_messages: 'contact_messages',
  contactmessages: 'contact_messages',
  resume_files: 'resume_files',
  resumefiles: 'resume_files',
};

function sanitizeDoc(value) {
  if (value === null || value === undefined) return null;
  if (value instanceof ObjectId) return value.toString();
  if (value instanceof Date) return value;
  if (Buffer.isBuffer(value)) return value.toString('base64');
  if (Array.isArray(value)) return value.map(sanitizeDoc).filter((v) => v !== undefined);
  if (typeof value === 'object') {
    const clean = {};
    for (const [k, v] of Object.entries(value)) {
      if (v !== undefined && typeof v !== 'function') {
        clean[k] = sanitizeDoc(v);
      }
    }
    return clean;
  }
  return value;
}

async function migrate() {
  console.log('\n========================================');
  console.log('Connecting to MongoDB Atlas...');
  console.log('========================================');

  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 15000 });
  await client.connect();

  const urlObj = new URL(uri.replace(/^mongodb\+srv:\/\//i, 'http://'));
  const dbName = urlObj.pathname.replace(/^\//, '') || 'qaroo_cms';
  const mongoDb = client.db(dbName);

  console.log(`Connected to MongoDB database: "${dbName}"\n`);

  const collections = await mongoDb.listCollections().toArray();
  const collectionNames = collections.map((c) => c.name);

  console.log(`Discovered ${collectionNames.length} collection(s) in MongoDB:`, collectionNames.join(', '));
  console.log('Target Firebase Firestore Project: qaroo-india-pvt-ltd\n');

  let totalMigrated = 0;

  for (const mongoCol of collectionNames) {
    const firestoreCol = COLLECTION_MAP[mongoCol.toLowerCase()];
    if (!firestoreCol) {
      console.log(`[Skip] Collection "${mongoCol}" has no matching Firestore collection.`);
      continue;
    }

    const docs = await mongoDb.collection(mongoCol).find({}).toArray();
    console.log(`\nMigrating collection: "${mongoCol}" -> Firestore "${firestoreCol}" (${docs.length} documents)`);

    let colCount = 0;
    for (const rawDoc of docs) {
      const docId = String(rawDoc._id || rawDoc.id || rawDoc.slug);
      const cleanData = sanitizeDoc(rawDoc);

      delete cleanData._id;
      delete cleanData.id;

      try {
        await setDoc(doc(db, firestoreCol, docId), {
          ...cleanData,
          _id: docId,
          id: docId,
          updatedAt: cleanData.updatedAt || serverTimestamp(),
        });
        colCount++;
        totalMigrated++;
      } catch (err) {
        console.error(`  [Error] Failed to write doc "${docId}" in "${firestoreCol}":`, err.message);
      }
    }

    console.log(`  -> Successfully migrated ${colCount}/${docs.length} documents into "${firestoreCol}".`);
  }

  await client.close();
  console.log('\n========================================');
  console.log(`Migration Complete: ${totalMigrated} total documents migrated to Firebase Firestore!`);
  console.log('========================================\n');
  process.exit(0);
}

migrate().catch((err) => {
  console.error('\n[Fatal Error during migration]:', err.message);
  process.exit(1);
});
