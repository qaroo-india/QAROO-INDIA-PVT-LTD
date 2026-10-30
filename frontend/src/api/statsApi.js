import { get } from './api.js';

export const statsApi = {
  getStats: () => get('/stats'),
};
