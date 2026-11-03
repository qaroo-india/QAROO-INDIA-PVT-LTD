import { get, post, del } from './api.js';

export const applicationApi = {
  // Public submission - no cookies needed, matching the contact form.
  submit: (data) => post('/applications', data, undefined, { credentials: 'omit' }),
  list: (params) => get('/applications', params),
  get: (id) => get(`/applications/${id}`),
  setStatus: (id, data) => post(`/applications/${id}/status`, data),
  remove: (id) => del(`/applications/${id}`),
};
