import { cloudinary } from '../config/cloudinary.js';

/**
 * Default Cloudinary options for bike image uploads:
 * - folder: bike_images
 * - optimizations: quality: "auto", fetch_format: "auto"
 * - dimensions: max width 1200px with crop: "limit"
 */
const DEFAULT_UPLOAD_OPTIONS = {
  folder: 'bike_images',
  resource_type: 'image',
  transformation: [
    {
      width: 1200,
      crop: 'limit',
      quality: 'auto',
      fetch_format: 'auto',
    },
  ],
};

/**
 * Uploads an image buffer or stream to Cloudinary
 * @param {Buffer} fileBuffer - The image buffer from multer
 * @param {Object} [customOptions={}] - Optional custom Cloudinary upload options
 * @returns {Promise<Object>} Resolves with Cloudinary upload result including secure_url and public_id
 */
export function uploadImageToCloudinary(fileBuffer, customOptions = {}) {
  return new Promise((resolve, reject) => {
    if (!fileBuffer) {
      return reject(new Error('No file buffer provided for upload.'));
    }

    const uploadOptions = {
      ...DEFAULT_UPLOAD_OPTIONS,
      ...customOptions,
      // Ensure transformation retains required optimizations unless explicitly overridden
      transformation: customOptions.transformation || DEFAULT_UPLOAD_OPTIONS.transformation,
    };

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('[Cloudinary Service Error]:', error);
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
}

/**
 * Delete an image from Cloudinary using its public_id
 * @param {string} publicId - The Cloudinary public_id (e.g., 'bike_images/kxwh8sdvqgzyamibjsnv')
 * @returns {Promise<Object>} Resolves with { success: boolean, result: string, public_id: string }
 */
export async function deleteImageFromCloudinary(publicId) {
  if (!publicId || typeof publicId !== 'string') {
    throw new Error('A valid string public_id is required to delete an image.');
  }

  // Sanitize publicId in case a full URL was accidentally passed
  const resolvedPublicId = extractPublicId(publicId) || publicId;

  try {
    const response = await cloudinary.uploader.destroy(resolvedPublicId, {
      resource_type: 'image',
      invalidate: true,
    });

    return {
      success: response.result === 'ok',
      result: response.result, // 'ok' or 'not found'
      public_id: resolvedPublicId,
    };
  } catch (error) {
    console.error(`[Cloudinary Delete Error for ${resolvedPublicId}]:`, error);
    throw error;
  }
}

/**
 * Delete multiple images from Cloudinary by their public_ids
 * @param {string[]} publicIds - Array of Cloudinary public_ids or URLs
 * @returns {Promise<Object[]>} Results of deletion attempts
 */
export async function deleteMultipleImagesFromCloudinary(publicIds) {
  if (!Array.isArray(publicIds) || publicIds.length === 0) {
    return [];
  }

  const cleanIds = publicIds
    .map((id) => extractPublicId(id) || id)
    .filter(Boolean);

  if (cleanIds.length === 0) {
    return [];
  }

  // Run in parallel
  const results = await Promise.allSettled(
    cleanIds.map((id) => deleteImageFromCloudinary(id))
  );

  return results.map((res, index) => {
    if (res.status === 'fulfilled') {
      return res.value;
    }
    return {
      success: false,
      public_id: cleanIds[index],
      error: res.reason?.message || 'Delete failed',
    };
  });
}

/**
 * Helper to extract Cloudinary public_id from a Cloudinary URL or return the input as is
 * @param {string} urlOrId - A Cloudinary URL or raw public_id
 * @returns {string|null} The extracted public_id (e.g. 'bike_images/sample')
 */
export function extractPublicId(urlOrId) {
  if (!urlOrId || typeof urlOrId !== 'string') return null;

  // If it's not a URL, assume it's already a public_id
  if (!urlOrId.startsWith('http://') && !urlOrId.startsWith('https://')) {
    return urlOrId.trim();
  }

  // Regex to extract path after /upload/ (skipping version prefix v12345/ if present) and stripping file extension
  const match = urlOrId.match(/\/upload\/(?:v\d+\/)?(.+?)(?:\.[a-zA-Z0-9]+)?$/);
  return match ? match[1] : null;
}

export default {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
  deleteMultipleImagesFromCloudinary,
  extractPublicId,
};

