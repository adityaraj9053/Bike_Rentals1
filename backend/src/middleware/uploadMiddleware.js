import multer from 'multer';
import path from 'path';

// Allowed MIME types and extensions for bike image uploads (Cloudinary)
const ALLOWED_IMAGE_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

const ALLOWED_IMAGE_EXTENSIONS = new Set([
  '.jpg',
  '.jpeg',
  '.png',
  '.webp',
]);

// Allowed MIME types and extensions for sensitive document uploads (Cloudflare R2)
export const ALLOWED_DOC_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png',
]);

export const ALLOWED_DOC_EXTENSIONS = new Set([
  '.pdf',
  '.jpg',
  '.jpeg',
  '.png',
]);

// Memory storage to stream directly to Cloudinary or Cloudflare R2 without writing to local disk
const storage = multer.memoryStorage();

// File filter validating image types (jpg, png, webp)
const imageFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  const isMimeValid = ALLOWED_IMAGE_MIME_TYPES.has(mime);
  const isExtValid = ALLOWED_IMAGE_EXTENSIONS.has(ext);

  if (isMimeValid && isExtValid) {
    return cb(null, true);
  }

  const err = new Error(
    `Invalid file type for "${file.originalname}". Only JPG, PNG, and WebP images are allowed.`
  );
  err.code = 'INVALID_FILE_TYPE';
  err.statusCode = 400;
  return cb(err, false);
};

// Base multer instance for images (max 10MB per file, max 10 files per request)
const imageUpload = multer({
  storage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
    files: 10,
  },
});

/**
 * Express middleware that handles single or multiple image uploads under any field name,
 * returning friendly error responses for validation failures.
 */
export function handleBikeImageUpload(req, res, next) {
  imageUpload.any()(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Image file size exceeds the 10MB limit.',
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files uploaded. Maximum 10 images allowed per request.',
          });
        }
        return res.status(400).json({
          success: false,
          message: `Upload validation error: ${err.message}`,
        });
      }

      if (err.code === 'INVALID_FILE_TYPE' || err.statusCode === 400) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: err.message || 'Error processing uploaded files.',
      });
    }

    next();
  });
}

// Strict document file filter accepting PDFs, JPEGs, and PNGs only
const documentFileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const mime = (file.mimetype || '').toLowerCase();

  const isMimeValid = ALLOWED_DOC_MIME_TYPES.has(mime);
  const isExtValid = ALLOWED_DOC_EXTENSIONS.has(ext);

  if (isMimeValid && isExtValid) {
    return cb(null, true);
  }

  const err = new Error(
    `Invalid document file type for "${file.originalname}". Only PDF, JPEG, and PNG files are accepted.`
  );
  err.code = 'INVALID_FILE_TYPE';
  err.statusCode = 400;
  return cb(err, false);
};

// Multer instance for sensitive document uploads (max 10MB per file)
const documentUpload = multer({
  storage,
  fileFilter: documentFileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB strict limit
    files: 5,
  },
});

/**
 * Express middleware for strict confidential document uploads (PDF, JPEG, PNG, max 10MB).
 * Accepts files on fields like 'document', 'file', 'aadhaar', 'drivingLicence', 'rc', 'insurance', 'puc' or any field.
 */
export function handleDocumentUpload(req, res, next) {
  documentUpload.any()(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            message: 'Document file size exceeds the 10MB limit.',
          });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            message: 'Too many files uploaded in one request.',
          });
        }
        return res.status(400).json({
          success: false,
          message: `Document upload validation error: ${err.message}`,
        });
      }

      if (err.code === 'INVALID_FILE_TYPE' || err.statusCode === 400) {
        return res.status(400).json({
          success: false,
          message: err.message,
        });
      }

      return res.status(500).json({
        success: false,
        message: err.message || 'Error processing uploaded document.',
      });
    }

    next();
  });
}

export default handleBikeImageUpload;
