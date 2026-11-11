import {
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  HeadObjectCommand,
  ListObjectsV2Command,
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
  'aadhaar card': 'aadhaar',
  aadhaarcard: 'aadhaar',
  'driving-licence': 'driving-licence',
  'driving-license': 'driving-licence',
  drivinglicence: 'driving-licence',
  drivinglicense: 'driving-licence',
  driving_licence: 'driving-licence',
  driving_license: 'driving-licence',
  'driving licence': 'driving-licence',
  'driving license': 'driving-licence',
  dl: 'driving-licence',
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

/**
 * Scan R2 bucket to find the latest uploaded document key for a bike
 * @param {string} bikeId - Bike ID or registration number
 * @param {string} docType - 'rc' | 'insurance' | 'puc'
 * @returns {Promise<string|null>} Found R2 key or null
 */
export async function findBikeDocumentKey(bikeId, docType) {
  const cleanBikeId = (bikeId?._id ? String(bikeId._id) : String(bikeId || '')).trim();
  const cleanDocType = (typeof docType === 'string' ? docType : String(docType || '')).toLowerCase().trim();
  if (!isR2Configured() || !cleanBikeId || !cleanDocType) return null;

  try {
    const normalizedType = VALID_BIKE_DOC_TYPES[cleanDocType] || cleanDocType;
    const prefix = `documents/bikes/${cleanBikeId}/${normalizedType}/`;

    const res = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: 10,
      })
    );

    const contents = res.Contents || [];
    if (contents.length === 0) return null;

    // Sort by LastModified descending to get the newest file
    contents.sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));
    return contents[0].Key;
  } catch (err) {
    console.warn(`[findBikeDocumentKey] Warning for ${cleanBikeId}/${cleanDocType}:`, err.message);
    return null;
  }
}

/**
 * Scan R2 bucket to find the latest uploaded document key for a user
 * @param {string} userId - User ID
 * @param {string} docType - 'aadhaar' | 'driving-licence'
 * @returns {Promise<string|null>} Found R2 key or null
 */
export async function findUserDocumentKey(userId, docType) {
  const cleanUserId = (userId?._id ? String(userId._id) : String(userId || '')).trim();
  const cleanDocType = (typeof docType === 'string' ? docType : String(docType || '')).toLowerCase().trim();
  if (!isR2Configured() || !cleanUserId || !cleanDocType) return null;

  try {
    const normalizedType = VALID_USER_DOC_TYPES[cleanDocType] || cleanDocType;
    const prefix = `documents/users/${cleanUserId}/${normalizedType}/`;

    const res = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: 10,
      })
    );

    const contents = res.Contents || [];
    if (contents.length === 0) return null;

    contents.sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));
    return contents[0].Key;
  } catch (err) {
    console.warn(`[findUserDocumentKey] Warning for ${cleanUserId}/${cleanDocType}:`, err.message);
    return null;
  }
}

/**
 * Search Cloudflare R2 bucket for any document matching a filename or partial name
 * @param {string} rawFilename - Original file name (e.g. "Screenshot 2026-11-11 120511.png")
 * @param {string} [bikeOrUserId=null] - Optional bike or user identifier to narrow search
 * @param {string} [docType=null] - Optional docType to narrow search
 * @returns {Promise<string|null>} Found R2 key or null
 */
export async function findDocumentKeyByFilename(rawFilename, bikeOrUserId = null, docType = null) {
  if (!isR2Configured() || !rawFilename || typeof rawFilename !== 'string') return null;

  try {
    let decodedRaw = rawFilename.trim();
    try {
      decodedRaw = decodeURIComponent(decodedRaw);
    } catch (e) {}

    // Extract bare filename if a path or url was passed
    const cleanRaw = path.basename(decodedRaw.replace(/^https?:\/\/[^\/]+\//, ''));
    if (!cleanRaw) return null;

    const ext = path.extname(cleanRaw).toLowerCase();
    const base = path.basename(cleanRaw, ext);
    const sanitizedBase = base.replace(/[^a-zA-Z0-9]/g, '_');

    const cleanId = (bikeOrUserId?._id ? String(bikeOrUserId._id) : String(bikeOrUserId || '')).trim();
    const cleanDocType = (typeof docType === 'string' ? docType : String(docType || '')).toLowerCase().trim();

    let prefix = 'documents/';
    const isUserDoc = Boolean(cleanDocType && VALID_USER_DOC_TYPES[cleanDocType]);
    const scopeFolder = isUserDoc ? 'users' : 'bikes';

    if (cleanId && cleanDocType) {
      const normDoc = VALID_USER_DOC_TYPES[cleanDocType] || VALID_BIKE_DOC_TYPES[cleanDocType] || cleanDocType;
      prefix = `documents/${scopeFolder}/${cleanId}/${normDoc}/`;
    } else if (cleanId) {
      prefix = `documents/${scopeFolder}/${cleanId}/`;
    }

    const res = await r2Client.send(
      new ListObjectsV2Command({
        Bucket: R2_BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: 100,
      })
    );

    const contents = res.Contents || [];
    if (contents.length === 0 && prefix !== 'documents/') {
      const fallbackRes = await r2Client.send(
        new ListObjectsV2Command({
          Bucket: R2_BUCKET_NAME,
          Prefix: 'documents/',
          MaxKeys: 100,
        })
      );
      contents.push(...(fallbackRes.Contents || []));
    }

    const matches = contents.filter((item) => {
      const k = item.Key;
      if (k.includes(cleanRaw)) return true;
      const cleanKey = k.replace(/[^a-zA-Z0-9]/g, '_');
      if (sanitizedBase.length >= 3 && cleanKey.includes(sanitizedBase)) return true;
      return false;
    });

    if (matches.length > 0) {
      matches.sort((a, b) => new Date(b.LastModified) - new Date(a.LastModified));
      return matches[0].Key;
    }

    return null;
  } catch (err) {
    console.warn('[findDocumentKeyByFilename] Search error:', err.message);
    return null;
  }
}

/**
 * Robustly resolve any document reference (key, partial filename, or bikeId+docType) into a live signed URL
 * @param {string} keyOrValue - Existing stored value (can be an R2 key, a signed URL, or a filename)
 * @param {string} [bikeId=null] - Optional bike identifier for lookup fallback
 * @param {string} [docType=null] - Optional docType ('rc', 'insurance', 'puc')
 * @param {number} [expiresInSeconds=900] - Expiry in seconds (15 min)
 * @returns {Promise<string|null>}
 */
export async function resolveDocumentSignedUrl(
  keyOrValue,
  bikeId = null,
  docType = null,
  expiresInSeconds = 900
) {
  if (!isR2Configured()) return null;

  if (!keyOrValue && !bikeId && !docType) return null;

  let decodedValue = '';
  if (typeof keyOrValue === 'string') {
    try {
      decodedValue = decodeURIComponent(keyOrValue.trim());
    } catch (e) {
      decodedValue = keyOrValue.trim();
    }
  }

  // Strip leading slashes
  const strippedValue = decodedValue.replace(/^\/+/, '');

  // 1. If already a valid live full URL starting with http/https
  if (strippedValue.startsWith('https://') || strippedValue.startsWith('http://')) {
    const r2Match = strippedValue.match(/\/documents\/(bikes|users)\/[^?]+/);
    if (r2Match) {
      const extractedKey = `documents/${r2Match[1]}/${strippedValue.split(`/documents/${r2Match[1]}/`)[1].split('?')[0]}`;
      try {
        return await getSignedDocumentUrl(extractedKey, expiresInSeconds);
      } catch (e) {
        return strippedValue;
      }
    }

    // If it's a localhost link (e.g. http://localhost:8081/Screenshot...png or localhost:5000/...)
    if (strippedValue.includes('localhost:') || strippedValue.includes('127.0.0.1:')) {
      const extractedBasename = path.basename(strippedValue.split('?')[0]);
      if (extractedBasename) {
        const found = await findDocumentKeyByFilename(extractedBasename, bikeId, docType);
        if (found) {
          try {
            return await getSignedDocumentUrl(found, expiresInSeconds);
          } catch (e) {}
        }
      }
    } else {
      return strippedValue;
    }
  }

  // 2. If it's an exact R2 key (e.g. documents/bikes/... or documents/users/...)
  if (strippedValue.startsWith('documents/')) {
    try {
      return await getSignedDocumentUrl(strippedValue, expiresInSeconds);
    } catch (e) {
      console.warn(`[resolveDocumentSignedUrl] Failed to sign key "${strippedValue}":`, e.message);
    }
  }

  // 3. If we have bikeId (or userId) and docType, search R2 directly
  if (bikeId && docType) {
    const cleanDoc = (typeof docType === 'string' ? docType : String(docType || '')).toLowerCase().trim();
    const isUserDoc = Boolean(VALID_USER_DOC_TYPES[cleanDoc]);
    const foundKey = isUserDoc
      ? await findUserDocumentKey(bikeId, docType)
      : await findBikeDocumentKey(bikeId, docType);
    if (foundKey) {
      try {
        return await getSignedDocumentUrl(foundKey, expiresInSeconds);
      } catch (e) {
        console.warn(`[resolveDocumentSignedUrl] Failed to sign found key "${foundKey}":`, e.message);
      }
    }
  }

  // 4. If keyOrValue is a plain filename or partial path
  if (strippedValue) {
    const foundByFilename = await findDocumentKeyByFilename(strippedValue, bikeId, docType);
    if (foundByFilename) {
      try {
        return await getSignedDocumentUrl(foundByFilename, expiresInSeconds);
      } catch (e) {
        console.warn(`[resolveDocumentSignedUrl] Failed to sign key "${foundByFilename}":`, e.message);
      }
    }
  }

  return null;
}


