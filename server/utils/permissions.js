// Defines every granular permission in the system.
export const ALL_PERMISSIONS = [
  'dashboard.view',

  'mou.create',
  'mou.read',
  'mou.update',
  'mou.delete',

  'home.update',

  'about.update',

  'footer.update',

  'business.create',
  'business.read',
  'business.update',
  'business.delete',

  'learning.create',
  'learning.read',
  'learning.update',
  'learning.delete',

  'csr.create',
  'csr.read',
  'csr.update',
  'csr.delete',

  'careers.create',
  'careers.read',
  'careers.update',
  'careers.delete',

  'applications.read',
  'applications.update',
  'applications.delete',

  'contact.read',
  // Enforced by POST /api/contact/:id/remarks and by the Contact page content
  // update in pageRoutes. Without it in this list the permission cannot be
  // granted to anyone, so saving remarks and editing the Contact page were
  // reachable only by a Super Admin (who bypasses every check).
  'contact.update',
  'contact.delete',

  'admin.create',
  'admin.read',
  'admin.update',
  'admin.delete',

  'permissions.manage',
];

export const isPermissionValid = (perm) => ALL_PERMISSIONS.includes(perm);

export function hasPermission(admin, permission) {
  if (!admin) return false;
  if (admin.role === 'superadmin') return true;
  if (!admin.permissions) return false;
  return admin.permissions.includes(permission);
}
