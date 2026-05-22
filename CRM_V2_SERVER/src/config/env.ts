import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const isDevelopment = (process.env.ENVIRONMENT || 'development').toLowerCase() !== 'production';

const normalizeDevUrl = (value: string | undefined, fallback: string, localValue: string) => {
  if (!value) {
    return fallback;
  }

  if (!isDevelopment) {
    return value;
  }

  if (/localhost|127\.0\.0\.1/i.test(value)) {
    return value;
  }

  if (/ondigitalocean\.app|plexis-staging/i.test(value)) {
    return localValue;
  }

  return value;
};

const getFrontendUrl = () => {
  return normalizeDevUrl(process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:5173');
};

const getBackendUrl = () => {
  return normalizeDevUrl(process.env.BACKEND_URL, 'http://localhost:8080', 'http://localhost:8080');
};

if (!process.env.MONGO_URL) {
  throw new Error("❌ MONGO_URL is not defined in .env");
}

export const ENV = {
  PORT: process.env.PORT || 8080,
  MONGO_URL: process.env.MONGO_URL || 'mongodb://localhost:27017/plexis_crm',
  ENVIRONMENT: process.env.ENVIRONMENT || 'development',
  EMAIL: process.env.EMAIL || '',
  PASS: process.env.PASS || '',
  JWT_SECRET: process.env.JWT_SECRET || "your_jwt_secret_key",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || '',
  DO_SPACES_ACCESS_KEY: process.env.DO_SPACES_ACCESS_KEY || 'your_access_key_here',
  DO_SPACES_SECRET_KEY: process.env.DO_SPACES_SECRET_KEY || 'your_secret_key_here',
  DO_SPACES_ENDPOINT: process.env.DO_SPACES_ENDPOINT || 'blr1.digitaloceanspaces.com', // Region endpoint only (e.g., blr1.digitaloceanspaces.com, nyc3.digitaloceanspaces.com)
  DO_SPACES_BUCKET_NAME: process.env.DO_SPACES_BUCKET_NAME || 'your_bucket_name_here',
  BACKEND_URL: getBackendUrl(),
  FRONTEND_URL: getFrontendUrl(),
  GOOGLE_PHOTOS_CLIENT_ID: process.env.GOOGLE_PHOTOS_CLIENT_ID || '',
  GOOGLE_PHOTOS_CLIENT_SECRET: process.env.GOOGLE_PHOTOS_CLIENT_SECRET || '',
  GOOGLE_PHOTOS_REDIRECT_URI: process.env.GOOGLE_PHOTOS_REDIRECT_URI || '',
};
