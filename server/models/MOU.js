import { FirestoreModel } from '../db/FirestoreModel.js';
import { MOUS } from '../data/seedData.js';
import { mouLogoFor } from '../seed/assets.js';

const initialMous = (MOUS || []).map((m, i) => ({
  id: `mou-${i + 1}`,
  _id: `mou-${i + 1}`,
  ...m,
  status: 'published',
  logo: m.logo || mouLogoFor(m.name),
  images: m.images || [],
  sections: m.sections || [],
  createdAt: new Date(),
  updatedAt: new Date(),
}));

const MOU = new FirestoreModel('mous', {}, initialMous);
export default MOU;
