import { get, post, del } from './api.js';

export const authApi = {
  register: (data) => post('/auth/register', data),
  login: (data) => post('/auth/login', data),
  logout: () => post('/auth/logout'),
  me: () => get('/auth/me'),
  verifyEmail: (token) => get(`/auth/verify-email/${token}`),
  forgotPassword: (email) => post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => post(`/auth/reset-password/${token}`, { password }),
  sendPasswordChangeOtp: () => post('/auth/change-password/send-otp'),
  changePassword: (data) => post('/auth/change-password', data),
  deleteMe: () => del('/auth/me'),
};
