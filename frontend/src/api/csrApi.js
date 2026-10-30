import { get, post, put, del } from './api.js';

export const csrApi = {
  list: (params, opts) => get('/csr', params, opts),
  categories: (opts) => get('/csr/categories', {}, opts),
  get: (id) => get(`/csr/${id}`),
  create: (data) => post('/csr', data),
  update: (id, data) => put(`/csr/${id}`, data),
  remove: (id) => del(`/csr/${id}`),
  togglePublish: (id) => post(`/csr/${id}/publish`),
};
