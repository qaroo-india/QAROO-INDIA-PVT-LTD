import jwt from 'jsonwebtoken';
import Admin from '../models/Admin.js';

/**
 * True when a token was minted before the password last changed.
 *
 * A JWT is self-contained, so changing a password cannot by itself retire the
 * tokens already handed out. Comparing the token's `iat` against the stored
 * stamp is what actually ends the other sessions.
 */
export function tokenPredatesPasswordChange(decoded, admin) {
  if (!admin?.passwordChangedAt || !decoded?.iat) return false;
  return decoded.iat * 1000 < admin.passwordChangedAt.getTime();
}

// Attaches req.admin if a valid token is present, but never rejects.
export async function optionalAuth(req, res, next) {
  try {
    let token = null;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) token = authHeader.split(' ')[1];
    if (!token && req.cookies && req.cookies.accessToken) token = req.cookies.accessToken;

    if (!token) return next();

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
      return next();
    }
    const admin = await Admin.findById(decoded.id).select('+passwordChangedAt');
    if (admin && !admin.isDisabled && !tokenPredatesPasswordChange(decoded, admin)) req.admin = admin;
    next();
  } catch {
    next();
  }
}

export async function protect(req, res, next) {
  try {
    let token = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }

    if (!token && req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return res.status(401).json({ success: false, message: 'Not authorized, no token' });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, { algorithms: ['HS256'] });
    } catch {
      return res.status(401).json({ success: false, message: 'Not authorized, token invalid or expired' });
    }

    const admin = await Admin.findById(decoded.id).select('+passwordChangedAt');
    if (!admin) {
      return res.status(401).json({ success: false, message: 'Not authorized, admin not found' });
    }

    if (tokenPredatesPasswordChange(decoded, admin)) {
      return res.status(401).json({ success: false, message: 'Password was changed. Please sign in again.' });
    }

    if (admin.isDisabled) {
      return res.status(403).json({ success: false, message: 'Your account has been disabled' });
    }

    req.admin = admin;
    next();
  } catch {
    return res.status(500).json({ success: false, message: 'Authentication error' });
  }
}
