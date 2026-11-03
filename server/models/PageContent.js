import { FirestoreModel } from '../db/FirestoreModel.js';
import { PAGE_CONTENT } from '../data/seedData.js';
import { CAREERS_PAGE } from '../../src/data/careers.js';

const initialPages = [];
if (PAGE_CONTENT && typeof PAGE_CONTENT === 'object') {
  for (const [page, data] of Object.entries(PAGE_CONTENT)) {
    initialPages.push({
      id: `page-${page}`,
      _id: `page-${page}`,
      page,
      data,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}
if (CAREERS_PAGE) {
  initialPages.push({
    id: 'page-careers',
    _id: 'page-careers',
    page: 'careers',
    data: CAREERS_PAGE,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

const PageContent = new FirestoreModel('page_contents', {}, initialPages);
export default PageContent;
