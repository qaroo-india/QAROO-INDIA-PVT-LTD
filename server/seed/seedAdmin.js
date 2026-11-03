import Admin from '../models/Admin.js';
import { ALL_PERMISSIONS } from '../utils/permissions.js';

export async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || '').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';

  if (!email || !password) {
    throw new Error(
      'seedAdmin requires ADMIN_EMAIL and ADMIN_PASSWORD to be set. ' +
        'Refusing to create a Super Admin with default credentials.'
    );
  }
  const name = process.env.ADMIN_NAME || 'Qaroo Super Admin';

  let admin = await Admin.findOne({ email });

  if (admin) {
    console.log(`Super Admin "${email}" already exists - skipping.`);
    return admin;
  }

  const totalAdmins = await Admin.countDocuments();

  if (totalAdmins > 0) {
    console.log(
      `Admins already exist and "${email}" is not among them - skipping Super Admin creation. ` +
      `Either set ADMIN_EMAIL/ADMIN_PASSWORD to the existing super admin, or use the first registration.`
    );
    return null;
  }

  admin = await Admin.create({
    name,
    email,
    password,
    role: 'superadmin',
    permissions: ALL_PERMISSIONS,
    isEmailVerified: true,
    isApproved: true,
  });

  console.log(`Super Admin created: ${email}`);
  return admin;
}
