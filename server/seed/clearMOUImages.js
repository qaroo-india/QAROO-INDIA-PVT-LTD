// One-off cleanup: remove online image URLs from all existing MOU documents.
// Connects directly to MongoDB, clears `images`, disconnects, exits.
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config({ path: new URL('../.env', import.meta.url).pathname });

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/qaroo_cms';

try {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const res = await db.collection('mous').updateMany({}, { $set: { images: [] } });
  console.log(`Cleared images on ${res.modifiedCount} MOU(s).`);
} catch (err) {
  console.error('Failed to clear MOU images:', err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}