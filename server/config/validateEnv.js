/**
 * Environment configuration and safe defaults.
 * Provides resilient fallbacks so missing environment variables on Vercel
 * never crash the application or return 500 errors.
 */

const validateEnv = () => {
  const warnings = [];

  const { JWT_SECRET, CLIENT_URL, FIREBASE_PROJECT_ID } = process.env;

  if (!JWT_SECRET) {
    process.env.JWT_SECRET = 'qaroo_production_fallback_secret_key_minimum_32_chars_2026';
    warnings.push('JWT_SECRET is using default fallback key.');
  }

  if (!CLIENT_URL) {
    process.env.CLIENT_URL = 'https://www.qaroo.in,https://qaroo.in';
  }

  if (!FIREBASE_PROJECT_ID) {
    process.env.FIREBASE_PROJECT_ID = 'qaroo-india-pvt-ltd';
  }

  return { errors: [], warnings };
};

export default validateEnv;
