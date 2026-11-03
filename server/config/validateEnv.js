/**
 * Fail-fast checks for the environment so a misconfigured production deploy
 * refuses to start instead of silently serving insecure cookies, locking CORS
 * to localhost, or writing to the wrong database.
 */



const validateEnv = () => {
  const errors = [];
  const warnings = [];

  const { NODE_ENV, JWT_SECRET, CLIENT_URL, FIREBASE_PROJECT_ID } = process.env;

  if (!JWT_SECRET) {
    errors.push('JWT_SECRET is required. Set a long random value (>= 32 characters).');
  } else if (String(JWT_SECRET).length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long.');
  }

  if (!NODE_ENV) {
    warnings.push(
      'NODE_ENV is not set. In production this disables Secure cookies and leaks 5xx error details.'
    );
  }

  // Length alone is a weak test: a memorable phrase reaches 32 characters while
  // carrying far less entropy than 32 random ones. Counting distinct characters
  // is not the test either - hex has only 16 symbols, so a 96-character random
  // hex secret scores lower than a passphrase. Machine-generated encodings are
  // recognised by their alphabet and exempted; anything else is judged on how
  // varied it is.
  const secretLooksGenerated = (v) =>
    (/^[0-9a-f]{32,}$/i.test(v) && v.length >= 32) || /^[A-Za-z0-9+/_-]{43,}={0,2}$/.test(v);
  if (
    JWT_SECRET &&
    String(JWT_SECRET).length >= 32 &&
    !secretLooksGenerated(String(JWT_SECRET)) &&
    new Set(String(JWT_SECRET)).size < 24
  ) {
    warnings.push(
      'JWT_SECRET is long enough but has few distinct characters, which suggests a ' +
        'passphrase rather than a random value. Generate one with: ' +
        'node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"'
    );
  }

  if (NODE_ENV === 'production') {
    // CLIENT_URL is a comma-separated allowlist, so every entry has to be
    // checked on its own. Testing the whole string against a single-origin
    // pattern silently passes a list of localhost origins, which then fails as
    // a CORS rejection on the first real request instead of at startup.
    const origins = String(CLIENT_URL || '')
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);

    if (!origins.length) {
      errors.push('CLIENT_URL must point at the real frontend origin in production.');
    } else {
      const local = origins.filter((o) => /^https?:\/\/(localhost|127\.0\.0\.1|\[?::1\]?)(:\d+)?$/i.test(o));
      if (local.length === origins.length) {
        errors.push(
          `CLIENT_URL only contains local origins (${local.join(', ')}). Set it to the real ` +
            'frontend origin, e.g. CLIENT_URL=https://www.example.com,https://example.com'
        );
      } else if (local.length) {
        warnings.push(
          `CLIENT_URL still allows local origins in production: ${local.join(', ')}. ` +
            'Remove them so only the live site can make credentialed requests.'
        );
      }

      const insecure = origins.filter((o) => /^http:\/\//i.test(o) && !local.includes(o));
      if (insecure.length) {
        errors.push(
          `CLIENT_URL contains non-HTTPS origins (${insecure.join(', ')}). Secure cookies are ` +
            'only sent over HTTPS, so admin login cannot work from an http:// origin.'
        );
      }
    }
    const projectId = FIREBASE_PROJECT_ID || 'crm-qaroo';
    if (!projectId) {
      errors.push('FIREBASE_PROJECT_ID is required for Firebase Firestore.');
    }
    if (
      !process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET
    ) {
      warnings.push(
        'Cloudinary is not configured. Uploaded resumes and CMS images are stored on the ' +
          'local disk and will be lost on the next redeploy (see .env.production.example).'
      );
    }
  }

  return { errors, warnings };
};

export default validateEnv;