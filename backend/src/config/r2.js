import { S3Client } from '@aws-sdk/client-s3';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure .env is loaded
dotenv.config({ path: path.join(__dirname, '../../.env') });

const endpoint = process.env.CLOUDFLARE_R2_ENDPOINT?.trim();
const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID?.trim();
const secretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY?.trim();
export const R2_BUCKET_NAME = process.env.CLOUDFLARE_R2_BUCKET_NAME?.trim() || '';

if (!endpoint || !accessKeyId || !secretAccessKey || !R2_BUCKET_NAME) {
  console.warn(
    '[Cloudflare R2 Warning]: Cloudflare R2 credentials (CLOUDFLARE_R2_ENDPOINT, CLOUDFLARE_R2_ACCESS_KEY_ID, CLOUDFLARE_R2_SECRET_ACCESS_KEY, CLOUDFLARE_R2_BUCKET_NAME) are missing or incomplete in environment.'
  );
}

/**
 * Cloudflare R2 Storage Client
 * Configured as an S3-compatible client with path-style addressing.
 */
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: endpoint || undefined,
  credentials:
    accessKeyId && secretAccessKey
      ? {
          accessKeyId,
          secretAccessKey,
        }
      : undefined,
  forcePathStyle: true,
});

/**
 * Helper to check if R2 configuration is present
 */
export function isR2Configured() {
  return Boolean(endpoint && accessKeyId && secretAccessKey && R2_BUCKET_NAME);
}

export default r2Client;

