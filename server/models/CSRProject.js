import { FirestoreModel } from '../db/FirestoreModel.js';
import { CSR_PROJECTS } from '../data/seedData.js';

const initialCSR = [];
let csrIndex = 1;
if (CSR_PROJECTS && typeof CSR_PROJECTS === 'object') {
  Object.entries(CSR_PROJECTS).forEach(([year, projects]) => {
    if (Array.isArray(projects)) {
      projects.forEach((p) => {
        initialCSR.push({
          id: `csr-${csrIndex++}`,
          _id: `csr-${csrIndex}`,
          ...p,
          year,
          status: 'published',
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      });
    }
  });
}

const CSRProject = new FirestoreModel('csr_projects', {}, initialCSR);
export default CSRProject;
