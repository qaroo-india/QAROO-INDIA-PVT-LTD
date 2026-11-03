import { get, put } from './api.js';

export const contentApi = {
  listPages: () => get('/content/pages'),
  get: (page, opts) => get(`/content/${page}`, undefined, opts),
  update: (page, data) => put(`/content/${page}`, { data }),
};
