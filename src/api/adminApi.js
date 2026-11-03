import { get, put, post, del } from './api.js';

export const adminApi = {
  list: () => get('/admins'),
  create: (data) => post('/admins', data),
  update: (id, data) => put(`/admins/${id}`, data),
  approve: (id) => post(`/admins/${id}/approve`),
  reject: (id) => post(`/admins/${id}/reject`),
  toggleDisable: (id) => post(`/admins/${id}/disable`),
  remove: (id) => del(`/admins/${id}`),
  setPermissions: (id, permissions) => put(`/admins/${id}/permissions`, { permissions }),
  sendOtp: (id) => post(`/admins/${id}/send-otp`),
  verify: (id, otp) => post(`/admins/${id}/verify`, { otp }),
};
