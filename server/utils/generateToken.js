import jwt from 'jsonwebtoken';
import crypto from 'crypto';

export function generateAccessToken(admin) {
  return jwt.sign(
    { id: admin._id, role: admin.role },
    process.env.JWT_SECRET,
    { algorithm: 'HS256', expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
}

export function generateRefreshToken(admin) {
  return jwt.sign(
    { id: admin._id },
    process.env.JWT_SECRET + '_refresh',
    { algorithm: 'HS256', expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' }
  );
}

export function generateTokens(admin) {
  return {
    accessToken: generateAccessToken(admin),
    refreshToken: generateRefreshToken(admin),
  };
}

export function generateVerificationToken() {
  return crypto.randomBytes(32).toString('hex');
}

export function generateOTP(length = 6) {
  return crypto.randomInt(Math.pow(10, length - 1), Math.pow(10, length)).toString();
}

export const ACCESS_COOKIE_MAX_AGE = 15 * 60 * 1000;
export const REFRESH_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

/**
 * The attributes every auth cookie is set *and* cleared with.
 *
 * SameSite depends on how the site is deployed, so it is configurable:
 *
 *  - `lax` (default) is right when the frontend and the API share a registrable
 *    domain - qaroo.in with api.qaroo.in is still one site, so the cookie is
 *    sent normally.
 *  - `none` is required when they are genuinely cross-site, e.g. a frontend on
 *    *.vercel.app calling an API on qaroo.in. With `lax` the browser withholds
 *    the cookie on background fetches and admin login appears to succeed and
 *    then immediately log out.
 *
 * `SameSite=None` is only honoured on a Secure cookie, so it implies HTTPS
 * regardless of NODE_ENV - setting one without the other means the browser
 * drops the cookie silently.
 */
export function authCookieOptions() {
  const sameSite = (process.env.COOKIE_SAMESITE || 'lax').toLowerCase();
  const isProd = process.env.NODE_ENV === 'production';
  return {
    httpOnly: true,
    secure: isProd || sameSite === 'none',
    sameSite,
    path: '/',
  };
}

export function setAuthCookies(res, tokens) {
  const base = authCookieOptions();
  res.cookie('accessToken', tokens.accessToken, { ...base, maxAge: ACCESS_COOKIE_MAX_AGE });
  res.cookie('refreshToken', tokens.refreshToken, { ...base, maxAge: REFRESH_COOKIE_MAX_AGE });
}

/**
 * A cookie is only replaced when the clearing Set-Cookie carries the same
 * attributes it was created with. Clearing with just `path` leaves a
 * SameSite=None cookie in place on a cross-site logout, so the session stays
 * live in the browser after the user believes they signed out.
 */
export function clearAuthCookies(res) {
  const base = authCookieOptions();
  res.clearCookie('accessToken', base);
  res.clearCookie('refreshToken', base);
}
