import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: [true, 'Name is required'], trim: true },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    // select: false so the hash is never loaded unless a caller asks for it.
    // toJSON already strips it, but that only covers serialisation - a future
    // .lean() query or a hand-built response object would bypass it entirely.
    // Only the login path needs the hash, and it asks with +password.
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false,
    },
    role: { type: String, enum: ['superadmin', 'admin'], default: 'admin' },
    permissions: { type: [String], default: [] },
    isEmailVerified: { type: Boolean, default: false },
    isApproved: { type: Boolean, default: false },
    isDisabled: { type: Boolean, default: false },
    verificationToken: { type: String, default: null },
    verificationTokenExpires: { type: Date, default: null },
    // Password reset has its own token, kept apart from verificationToken.
    // Sharing one field let either link do both jobs: a verification email
    // could set the account's password, so forwarding an invite was an account
    // takeover. Stored as a SHA-256 digest, so a database disclosure does not
    // hand over usable reset links.
    resetTokenHash: { type: String, default: null, select: false },
    resetTokenExpires: { type: Date, default: null, select: false },
    // When the password last changed. Tokens issued before this are refused.
    passwordChangedAt: { type: Date, select: false },
    verificationOTP: { type: String, default: null },
    verificationOTPExpires: { type: Date, default: null },
    // Temporary plaintext credential used for the first-login confirmation email.
    // Cleared as soon as the confirmation email is sent; never exposed via the API.
    initialPassword: { type: String, default: '', select: false },
    passwordOTP: { type: String, default: null, select: false },
    passwordOTPExpires: { type: Date, default: null, select: false },
    // The OTP is the only factor protecting a password change, so guessing has
    // to be bounded per code rather than only per IP: a 6-digit code is a
    // million combinations, which an IP-based limit alone would eventually let
    // through across windows. The code is discarded once this runs out.
    passwordOTPAttempts: { type: Number, default: 0, select: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', default: null },
    // Sparse-unique bootstrap marker: at most ONE admin can ever hold it, which
    // atomically decides the "first registrant" even under concurrent races.
    // The holder is promoted to Super Admin once they verify their email.
    // Deliberately has NO default: a sparse index only skips documents where the
    // path is absent, not ones holding an explicit null. With `default: null`
    // every ordinary admin wrote a null and the unique index would reject the
    // second one - which never showed up only because the index was declared
    // twice (here and below) and so never applied as unique. The marker is set
    // to `true` for the first registrant and left off everyone else.
    bootstrap: { type: Boolean },
  },
  { timestamps: true }
);

adminSchema.index({ bootstrap: 1 }, { unique: true, sparse: true });

adminSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  // Stamped so every token minted before this moment stops being accepted: a
  // JWT carries no server-side state, so without this a session on another
  // device keeps working for up to the refresh token's seven days after the
  // password was changed or reset. Backdated a second because the token issued
  // immediately after a change would otherwise race its own stamp and be
  // rejected.
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

adminSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

adminSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  delete obj.verificationOTP;
  delete obj.initialPassword;
  delete obj.passwordOTP;
  delete obj.passwordOTPExpires;
  delete obj.passwordOTPAttempts;
  delete obj.resetTokenHash;
  delete obj.resetTokenExpires;
  // protect() loads this with +passwordChangedAt, so without this it would ride
  // along in every /me response. Harmless, but it is internal bookkeeping.
  delete obj.passwordChangedAt;
  return obj;
};

export default mongoose.model('Admin', adminSchema);
