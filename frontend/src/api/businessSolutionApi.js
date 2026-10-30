import { get, post, put, del } from './api.js';

export const businessSolutionApi = {
  list: (params, opts) => get('/business-solutions', params, opts),
  get: (id) => get(`/business-solutions/${id}`),
  getBySlug: (slug) => get(`/business-solutions/by-slug/${slug}`),
  create: (data) => post('/business-solutions', data),
  update: (id, data) => put(`/business-solutions/${id}`, data),
  remove: (id) => del(`/business-solutions/${id}`),
  togglePublish: (id) => post(`/business-solutions/${id}/publish`),
};
