import { get, post, put, del } from './api.js';

export const mouApi = {
  list: (params, opts) => get('/mous', params, opts),
  categories: (opts) => get('/mous/categories', {}, opts),
  get: (id) => get(`/mous/${id}`),
  create: (data) => post('/mous', data),
  update: (id, data) => put(`/mous/${id}`, data),
  remove: (id) => del(`/mous/${id}`),
  togglePublish: (id) => post(`/mous/${id}/publish`),
};
