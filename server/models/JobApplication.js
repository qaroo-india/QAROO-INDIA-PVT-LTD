import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FirestoreModel } from '../db/FirestoreModel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backupPath = path.resolve(__dirname, '../data/mongoBackup.json');

let initialApps = [];
try {
  if (fs.existsSync(backupPath)) {
    const raw = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    initialApps = (raw.jobapplications || []).map((app) => ({
      ...app,
      id: app._id || app.id,
      _id: app._id || app.id,
      createdAt: app.createdAt ? new Date(app.createdAt) : new Date(),
      updatedAt: app.updatedAt ? new Date(app.updatedAt) : new Date(),
    }));
  }
} catch {
  // Graceful fallback
}

const JobApplication = new FirestoreModel('job_applications', {}, initialApps);
export default JobApplication;
