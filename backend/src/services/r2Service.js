import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import path from 'path';
import crypto from 'crypto';
import { r2Client, R2_BUCKET_NAME, isR2Configured } from '../config/r2.js';

// Allowed MIME types and extensions for sensitive document uploads
export const ALLOWED_DOCUMENT_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]);

export const ALLOWED_DOCUMENT_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
]);

export const MAX_DOCUMENT_SIZE_BYTES = 10 * 1024 * 1024; // 10MB limit

// Document types allowed for users and bikes
export const VALID_USER_DOC_TYPES = {
  aadhaar: 'aadhaar',
  'driving-licence': 'driving-licence',
  'driving-license': 'driving-licence', // Alias
  dl: 'driving-licence', // Alias
};

export const VALID_BIKE_DOC_TYPES = {
  rc: 'rc',
  insurance: 'insurance',
  puc: 'puc',
  'authorization-deed': 'authorization-deed',
  authorizationdeed: 'authorization-deed',
  authorizationDeed: 'authorization-deed',
  poa: 'authorization-deed',
};

/**
 * Validates file buffer, mimetype, and extension strictly against PDF, JPEG, and PNG (max 10MB)
 * @param {Object} file - File object containing originalname, mimetype, size, and buffer
 */
export function validateDocumentFile(file) {
  if (!file) {
    throw new Error('No file provided for validation.');
  }

  const { originalname = '', mimetype = '', size = 0, buffer } = file;
  const ext = path.extname(originalname).toLowerCase();
  const normalizedMime = (mimetype || '').toLowerCase();

  if (!ALLOWED_DOCUMENT_MIME_TYPES.has(normalizedMime) || !ALLOWED_DOCUMENT_EXTENSIONS.has(ext)) {
    const error = new Error(
      `Invalid file type for "${originalname}". Only PDF, JPEG, and PNG documents are allowed.`
    );
    error.code = 'INVALID_FILE_TYPE';
    error.statusCode = 400;
    throw error;
  }

  const actualSize = size || (buffer ? buffer.length : 0);
  if (actualSize > MAX_DOCUMENT_SIZE_BYTES) {
    const error = new Error(
      `File size (${(actualSize / (1024 * 1024)).toFixed(2)}MB) exceeds the 10MB maximum limit.`
    );
    error.code = 'LIMIT_FILE_SIZE';
    error.statusCode = 400;
    throw error;
  }

  return true;
}

/**
 * Sanitize filename to ensure safe S3/R2 storage key naming
 */
export function sanitizeFilename(filename = 'document') {
  const ext = path.extname(filename).toLowerCase();
  const base = path.basename(filename, ext)
    .replace(/[^a-zA-Z0-9_-]/g, '_')
    .slice(0, 60);
  const randomSuffix = crypto.randomBytes(4).toString('hex');
  const timestamp = Date.now();
  return `${base || 'doc'}_${timestamp}_${randomSuffix}${ext}`;
}

/**
 * Build standardized R2 storage key for user identity documents:
 * Pattern: documents/users/{userId}/aadhaar/{filename}
 * Pattern: documents/users/{userId}/driving-licence/{filename}
 *
 * @param {string} userId - User identifier
 * @param {string} docType - 'aadhaar' or 'driving-licence'
 * @param {string} originalname - Original file name
 * @returns {string} R2 object key
 */
export function buildUserDocumentKey(userId, docType, originalname) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('A valid userId is required to generate the user document key.');
  }

  const normalizedType = VALID_USER_DOC_TYPES[docType?.toLowerCase()?.trim()];
  if (!normalizedType) {
    throw new Error(
      `Invalid user document type "${docType}". Allowed types: aadhaar, driving-licence`
    );
  }

  const cleanFilename = sanitizeFilename(originalname);
  return `documents/users/${userId.trim()}/${normalizedType}/${cleanFilename}`;
}

/**
 * Build standardized R2 storage key for bike compliance documents:
 * Pattern: documents/bikes/{bikeId}/rc/{filename}
 * Pattern: documents/bikes/{bikeId}/insurance/{filename}
 * Pattern: documents/bikes/{bikeId}/puc/{filename}
 *
 * @param {string} bikeId - Bike identifier
 * @param {string} docType - 'rc', 'insurance', or 'puc'
 * @param {string} originalname - Original file name
 * @returns {string} R2 object key
 */
export function buildBikeDocumentKey(bikeId, docType, originalname) {
  if (!bikeId || typeof bikeId !== 'string') {
    throw new Error('A valid bikeId is required to generate the bike document key.');
  }

  const normalizedType = VALID_BIKE_DOC_TYPES[docType?.toLowerCase()?.trim()];
  if (!normalizedType) {
    throw new Error(
      `Invalid bike document type "${docType}". Allowed types: rc, insurance, puc`
    );
  }

  const cleanFilename = sanitizeFilename(originalname);
  return `documents/bikes/${bikeId.trim()}/${normalizedType}/${cleanFilename}`;
}

/**
 * Upload a document buffer to Cloudflare R2
 *
 * @param {Object} params
 * @param {Buffer} params.fileBuffer - File binary buffer
 * @param {string} params.key - Complete destination key inside the bucket
 * @param {string} params.mimeType - MIME type of the document
 * @param {Object} [params.metadata={}] - Optional metadata headers
 * @returns {Promise<Object>} Upload result summary
 */
export async function uploadDocumentToR2({
  fileBuffer,
  key,
  mimeType,
  metadata = {},
}) {
  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 is not properly configured. Check environment variables.');
  }

  if (!fileBuffer || !Buffer.isBuffer(fileBuffer)) {
    throw new Error('A valid binary Buffer is required for document upload.');
  }

  if (!key || typeof key !== 'string') {
    throw new Error('A valid destination key is required.');
  }

  const uploadCommand = new PutObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType || 'application/octet-stream',
    Metadata: {
      uploadedAt: new Date().toISOString(),
      ...metadata,
    },
  });

  await r2Client.send(uploadCommand);

  return {
    bucket: R2_BUCKET_NAME,
    key,
    size: fileBuffer.length,
    mimeType,
  };
}

/**
 * Generate a temporary, expiring signed URL for private document download/viewing.
 *
 * @param {string} key - R2 object key (e.g. documents/users/... or documents/bikes/...)
 * @param {number} [expiresInSeconds=900] - Expiration duration in seconds (default 15 mins = 900s, recommended 10-15 mins)
 * @param {Object} [options={}] - Additional options (e.g. contentDisposition for forced download)
 * @returns {Promise<string>} Signed expiring URL
 */
export async function getSignedDocumentUrl(
  key,
  expiresInSeconds = 900,
  options = {}
) {
  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 is not properly configured. Check environment variables.');
  }

  if (!key || typeof key !== 'string') {
    throw new Error('A valid object key is required to generate a signed URL.');
  }

  // Ensure expiry stays within safe bounds (1 minute to 1 hour; default 15 minutes)
  const safeExpiry = Math.max(60, Math.min(3600, Number(expiresInSeconds) || 900));

  const command = new GetObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
    ...(options.responseContentDisposition
      ? { ResponseContentDisposition: options.responseContentDisposition }
      : {}),
  });

  const signedUrl = await getSignedUrl(r2Client, command, {
    expiresIn: safeExpiry,
  });

  return signedUrl;
}

/**
 * Delete a document from Cloudflare R2 by its key
 *
 * @param {string} key - R2 object key
 * @returns {Promise<Object>} Result of deletion
 */
export async function deleteDocumentFromR2(key) {
  if (!isR2Configured()) {
    throw new Error('Cloudflare R2 is not properly configured. Check environment variables.');
  }

  if (!key || typeof key !== 'string') {
    throw new Error('A valid object key is required to delete a document.');
  }

  const command = new DeleteObjectCommand({
    Bucket: R2_BUCKET_NAME,
    Key: key,
  });

  await r2Client.send(command);

  return {
    success: true,
    key,
    bucket: R2_BUCKET_NAME,
  };
}

/**
 * Check if a document exists in Cloudflare R2
 *
 * @param {string} key - R2 object key
 * @returns {Promise<boolean>} True if exists, false otherwise
 */
export async function documentExistsInR2(key) {
  if (!isR2Configured() || !key) return false;

  try {
    const command = new HeadObjectCommand({
      Bucket: R2_BUCKET_NAME,
      Key: key,
    });
    await r2Client.send(command);
    return true;
  } catch (err) {
    if (err.name === 'NotFound' || err.$metadata?.httpStatusCode === 404) {
      return false;
    }
    throw err;
  }
}

