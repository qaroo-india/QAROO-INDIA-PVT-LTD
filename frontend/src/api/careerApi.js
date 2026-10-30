import { get, post, put, del } from './api.js';

export const careerApi = {
  list: (params, opts) => get('/careers', params, opts),
  get: (id) => get(`/careers/${id}`),
  getBySlug: (slug, opts) => get(`/careers/by-slug/${slug}`, undefined, opts),
  create: (data) => post('/careers', data),
  update: (id, data) => put(`/careers/${id}`, data),
  remove: (id) => del(`/careers/${id}`),
  togglePublish: (id) => post(`/careers/${id}/publish`),
};
