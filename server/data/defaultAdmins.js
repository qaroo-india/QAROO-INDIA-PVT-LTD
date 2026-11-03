import { ALL_PERMISSIONS } from '../utils/permissions.js';

// Pre-computed verified bcrypt hash for QarooSuperAdmin#2026:
// $2a$10$40LIxiP1e9rXoEbvBTjD/.MlsfmGoMoWYJuC6YN9./bgkTQugb1XC
const SUPERADMIN_HASH = '$2a$10$40LIxiP1e9rXoEbvBTjD/.MlsfmGoMoWYJuC6YN9./bgkTQugb1XC';

export const DEFAULT_ADMINS = [
  {
    _id: 'superadmin_qaroo_admin_001',
    id: 'superadmin_qaroo_admin_001',
    name: 'Qaroo Super Admin',
    email: 'admin@qaroo.in',
    password: SUPERADMIN_HASH,
    role: 'superadmin',
    permissions: ALL_PERMISSIONS,
    isEmailVerified: true,
    isApproved: true,
    isDisabled: false,
    createdAt: new Date('2026-11-03T10:00:00.000Z'),
    updatedAt: new Date('2026-11-03T10:00:00.000Z'),
  },
  {
    _id: 'superadmin_qaroo_master_002',
    id: 'superadmin_qaroo_master_002',
    name: 'Qaroo Super Admin',
    email: 'superadmin@qaroo.in',
    password: SUPERADMIN_HASH,
    role: 'superadmin',
    permissions: ALL_PERMISSIONS,
    isEmailVerified: true,
    isApproved: true,
    isDisabled: false,
    createdAt: new Date('2026-11-03T10:00:00.000Z'),
    updatedAt: new Date('2026-11-03T10:00:00.000Z'),
  },
  {
    _id: '6a9183190af568ca37cb7540',
    id: '6a9183190af568ca37cb7540',
    name: 'Qaroo Super Admin',
    email: 'support@qaroo.in',
    password: SUPERADMIN_HASH,
    role: 'superadmin',
    permissions: ALL_PERMISSIONS,
    isEmailVerified: true,
    isApproved: true,
    isDisabled: false,
    createdAt: new Date('2026-09-01T06:00:00.000Z'),
    updatedAt: new Date('2026-11-03T10:00:00.000Z'),
  },
  {
    _id: '6a9183190af568ca37cb7541',
    id: '6a9183190af568ca37cb7541',
    name: 'Anunitha M R',
    email: 'anunithamr@gmail.com',
    password: SUPERADMIN_HASH,
    role: 'superadmin',
    permissions: ALL_PERMISSIONS,
    isEmailVerified: true,
    isApproved: true,
    isDisabled: false,
    createdAt: new Date('2026-09-01T06:00:00.000Z'),
    updatedAt: new Date('2026-11-03T10:00:00.000Z'),
  },
];

export default DEFAULT_ADMINS;
