import bcrypt from 'bcryptjs';
import { FirestoreModel } from '../db/FirestoreModel.js';

const Admin = new FirestoreModel('admins', {
  async matchPassword(entered) {
    return bcrypt.compare(entered, this.password);
  },
});

export default Admin;
