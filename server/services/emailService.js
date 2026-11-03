import nodemailer from 'nodemailer';
import { clientUrl } from '../config/site.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (
    !process.env.EMAIL_HOST ||
    !process.env.EMAIL_USER ||
    !process.env.EMAIL_PASSWORD
  ) {
    return null;
  }
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  return transporter;
}

// Returns the fallback verification link when email is not configured.
function fallbackLog(to, subject, text) {
  console.log('\n[EmailService: SMTP not configured - email not sent]');
  console.log(`  To: ${to}`);
  console.log(`  Subject: ${subject}`);
  console.log(`  Body:\n${text}\n`);
}

export async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    fallbackLog(to, subject, text || '');
    return { skipped: true };
  }
  try {
    await t.sendMail({
      from: process.env.EMAIL_FROM || 'Qaroo India Private Limited <no-reply@qaroo.in>',
      to,
      subject,
      text,
      html,
    });
    return { skipped: false };
  } catch (err) {
    console.error(`Email send error: ${err.message}`);
    fallbackLog(to, subject, text || '');
    return { skipped: true };
  }
}

export async function sendVerificationEmail(email, token) {
  const link = clientUrl(`/admin/verify-email?token=${token}`);
  const subject = 'Verify your Qaroo Admin account';
  const text = `Verify your Qaroo Admin account\n\nClick here to verify your email:\n${link}`;
  const html = `<p>Verify your Qaroo Admin account</p><p><a href="${link}">Click here to verify your email</a></p><p>If the link does not work, copy this into your browser:<br/>${link}</p>`;
  return sendMail({ to: email, subject, text, html });
}

export async function sendApprovalEmail(email, name) {
  const loginUrl = clientUrl('/admin/login');
  const subject = 'Your Qaroo Admin account has been approved';
  const text = `Hi ${name || 'there'},\n\nYour Qaroo Admin account has been approved. You can now log in here:\n${loginUrl}\n\nWelcome aboard!`;
  const html = `<p>Hi ${name || 'there'},</p><p>Your Qaroo Admin account has been <strong>approved</strong>. You can now log in here:</p><p><a href="${loginUrl}">${loginUrl}</a></p><p>Welcome aboard!</p>`;
  return sendMail({ to: email, subject, text, html });
}

export async function sendRejectionEmail(email, name) {
  const subject = 'Your Qaroo Admin account request was not approved';
  const text = `Hi ${name || 'there'},\n\nUnfortunately your Qaroo Admin account request was not approved. If you believe this is a mistake, please contact your administrator.`;
  const html = `<p>Hi ${name || 'there'},</p><p>Unfortunately your Qaroo Admin account request was <strong>not approved</strong>. If you believe this is a mistake, please contact your administrator.</p>`;
  return sendMail({ to: email, subject, text, html });
}

// The code is emailed to the ADMIN who creates the new user, not to the new user.
export async function sendAdminVerificationOTPEmail(creatorEmail, creatorName, userName, userEmail, otp) {
  const subject = `Verify the new Qaroo admin: ${userName}`;
  const text = `Hi ${creatorName || 'there'},\n\nYou created a new admin account:\nName: ${userName}\nEmail: ${userEmail}\n\nTheir verification code is:\n${otp}\n\nEnter this code in the Admin panel (Admin Management -> Verify) to confirm ${userEmail}. The code expires in 10 minutes.\n\nDo not share this code.`;
  const html = `<p>Hi ${creatorName || 'there'},</p><p>You created a new admin account:</p><p><strong>${userName}</strong> (${userEmail})</p><p>Their verification code is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#B3262D;text-align:center;padding:12px;background:#f4f4f4;border-radius:8px;">${otp}</p><p>Enter this code in the Admin panel (<strong>Admin Management -> Verify</strong>) to confirm ${userEmail}. The code expires in 10 minutes.</p><p><em>Do not share this code.</em></p>`;
  return sendMail({ to: creatorEmail, subject, text, html });
}

// Sent to the NEW user after the Super Admin successfully verifies their account via OTP.
// Includes the login credentials (username + password) so the user can sign in.
export async function sendVerificationSuccessEmail(email, name, setPasswordUrl) {
  const loginUrl = clientUrl('/admin/login');
  const subject = 'Your Qaroo Admin account is verified - set your password';

  // A link, never the password itself. Emailing a password means it lives in
  // two mailboxes and any forward or breach of either hands over the account,
  // and it forced the plaintext to be stored until verification. The link is
  // single-use, expires in an hour, and only its digest is kept.
  const body = setPasswordUrl
    ? {
      text: `Hi ${name || 'there'},

Your Qaroo Admin account has been verified.

Choose your password here (the link works once and expires in 1 hour):
${setPasswordUrl}

Your username is ${email}.

If the link has expired, use "Forgot password" on the sign-in page:
${loginUrl}`,
      html: `<p>Hi ${name || 'there'},</p>`
          + `<p>Your <strong>Qaroo Admin</strong> account has been verified.</p>`
          + `<p><a href="${setPasswordUrl}" style="display:inline-block;padding:10px 18px;background:#B3262D;color:#fff;text-decoration:none;border-radius:6px;">Choose your password</a></p>`
          + `<p style="font-size:13px;color:#555;">The link works once and expires in 1 hour. Your username is <strong>${email}</strong>.</p>`
          + `<p style="font-size:13px;color:#555;">If it has expired, use &ldquo;Forgot password&rdquo; on the <a href="${loginUrl}">sign-in page</a>.</p>`,
    }
    : {
      text: `Hi ${name || 'there'},

Your Qaroo Admin account has been verified and is now active.

Sign in here:
${loginUrl}`,
      html: `<p>Hi ${name || 'there'},</p><p>Your <strong>Qaroo Admin</strong> account has been verified and is now active.</p><p>Sign in here: <a href="${loginUrl}">${loginUrl}</a></p>`,
    };

  return sendMail({ to: email, subject, text: body.text, html: body.html });
}

// OTP sent to the user's registered admin email when they change their password.
export async function sendPasswordChangeOtpEmail(email, name, otp) {
  const subject = 'Your Qaroo Admin password change code';
  const text = `Hi ${name || 'there'},\n\nYour verification code for changing your Qaroo Admin password is:\n\n${otp}\n\nEnter this code in the Change Password page. It expires in 10 minutes.\n\nIf you did not request this, you can safely ignore this email.`;
  const html = `<p>Hi ${name || 'there'},</p><p>Your verification code for changing your Qaroo Admin password is:</p><p style="font-size:28px;font-weight:bold;letter-spacing:6px;color:#B3262D;text-align:center;padding:12px;background:#f4f4f4;border-radius:8px;">${otp}</p><p>Enter this code in the <strong>Change Password</strong> page. It expires in 10 minutes.</p><p>If you did not request this, you can safely ignore this email.</p>`;
  return sendMail({ to: email, subject, text, html });
}

// Password reset link emailed to the user (forgot password).
export async function sendPasswordResetEmail(email, name, link) {
  const subject = 'Reset your Qaroo Admin password';
  const text = `Hi ${name || 'there'},\n\nYou requested to reset your Qaroo Admin password.\n\nClick this link to choose a new password:\n${link}\n\nIf you did not request this, you can safely ignore this email.`;
  const html = `<p>Hi ${name || 'there'},</p><p>You requested to reset your Qaroo Admin password.</p><p><a href="${link}">Click this link to choose a new password</a></p><p>If the link does not work, copy this into your browser:<br/>${link}</p><p>If you did not request this, you can safely ignore this email.</p>`;
  return sendMail({ to: email, subject, text, html });
}
