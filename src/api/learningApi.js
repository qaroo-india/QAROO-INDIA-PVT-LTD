import { get, post, put, del } from './api.js';

export const learningApi = {
  list: (params, opts) => get('/learning', params, opts),
  get: (id) => get(`/learning/${id}`),
  getBySlug: (slug) => get(`/learning/by-slug/${slug}`),
  create: (data) => post('/learning', data),
  update: (id, data) => put(`/learning/${id}`, data),
  remove: (id) => del(`/learning/${id}`),
  togglePublish: (id) => post(`/learning/${id}/publish`),
};
