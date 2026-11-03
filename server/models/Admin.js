import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { FirestoreModel } from '../db/FirestoreModel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backupPath = path.resolve(__dirname, '../data/mongoBackup.json');

let initialAdmins = [];
try {
  if (fs.existsSync(backupPath)) {
    const raw = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    initialAdmins = (raw.admins || []).map((a) => ({
      ...a,
      id: a._id || a.id,
      _id: a._id || a.id,
      createdAt: a.createdAt ? new Date(a.createdAt) : new Date(),
      updatedAt: a.updatedAt ? new Date(a.updatedAt) : new Date(),
    }));
  }
} catch {
  // Graceful fallback
}

const Admin = new FirestoreModel(
  'admins',
  {
    async matchPassword(entered) {
      return bcrypt.compare(entered, this.password);
    },
  },
  initialAdmins
);

export default Admin;
