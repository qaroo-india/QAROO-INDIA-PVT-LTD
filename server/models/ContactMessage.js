import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { FirestoreModel } from '../db/FirestoreModel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backupPath = path.resolve(__dirname, '../data/mongoBackup.json');

let initialMessages = [];
try {
  if (fs.existsSync(backupPath)) {
    const raw = JSON.parse(fs.readFileSync(backupPath, 'utf8'));
    initialMessages = (raw.contactmessages || []).map((msg) => ({
      ...msg,
      id: msg._id || msg.id,
      _id: msg._id || msg.id,
      createdAt: msg.createdAt ? new Date(msg.createdAt) : new Date(),
      updatedAt: msg.updatedAt ? new Date(msg.updatedAt) : new Date(),
    }));
  }
} catch {
  // Graceful fallback
}

const ContactMessage = new FirestoreModel('contact_messages', {}, initialMessages);
export default ContactMessage;
