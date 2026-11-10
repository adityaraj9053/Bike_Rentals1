import {
  uploadImageToCloudinary,
  deleteImageFromCloudinary,
  deleteMultipleImagesFromCloudinary,
  extractPublicId,
} from '../services/cloudinaryService.js';

/**
 * Handle single or multiple bike image uploads to Cloudinary
 * POST /api/upload/bike-images
 */
export async function uploadBikeImages(req, res) {
  try {
    const rawFiles = req.files || (req.file ? [req.file] : []);
    const files = Array.isArray(rawFiles) ? rawFiles : Object.values(rawFiles).flat();

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No image files provided. Please attach at least one JPG, PNG, or WebP image.',
      });
    }

    // Upload all files concurrently
    const uploadPromises = files.map((file) =>
      uploadImageToCloudinary(file.buffer, {
        filename_override: file.originalname,
      })
    );

    const uploadResults = await Promise.all(uploadPromises);

    const formatted = uploadResults.map((result, index) => ({
      secure_url: result.secure_url,
      public_id: result.public_id,
      url: result.url,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      original_filename: files[index]?.originalname || result.original_filename,
    }));

    return res.status(200).json({
      success: true,
      message: `${formatted.length} image(s) uploaded successfully.`,
      count: formatted.length,
      data: formatted,
      // Provide convenient top-level accessors if single file uploaded
      ...(formatted.length === 1
        ? {
            secure_url: formatted[0].secure_url,
            public_id: formatted[0].public_id,
          }
        : {}),
    });
  } catch (error) {
    console.error('[Upload Controller Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to upload image(s) to Cloudinary.',
    });
  }
}

/**
 * Handle bike image deletion by public_id
 * DELETE /api/upload/bike-images
 * Can pass public_id in body, query params, or URL
 */
export async function deleteBikeImage(req, res) {
  try {
    const publicId =
      req.body?.public_id ||
      req.query?.public_id ||
      req.params?.publicId ||
      req.params?.public_id ||
      req.params[0];

    if (!publicId || typeof publicId !== 'string' || !publicId.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid public_id is required to delete an image.',
      });
    }

    const cleanPublicId = extractPublicId(publicId.trim()) || publicId.trim();
    const result = await deleteImageFromCloudinary(cleanPublicId);

    if (result.result === 'not found') {
      return res.status(404).json({
        success: false,
        message: `Image with public_id "${cleanPublicId}" was not found on Cloudinary.`,
        data: result,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Image deleted successfully from Cloudinary.',
      data: result,
    });
  } catch (error) {
    console.error('[Upload Controller Delete Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete image from Cloudinary.',
    });
  }
}

/**
 * Handle batch deletion of multiple images
 * POST /api/upload/bike-images/batch-delete
 */
export async function batchDeleteBikeImages(req, res) {
  try {
    const { public_ids } = req.body;

    if (!Array.isArray(public_ids) || public_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'An array of public_ids is required for batch deletion.',
      });
    }

    const results = await deleteMultipleImagesFromCloudinary(public_ids);

    return res.status(200).json({
      success: true,
      message: `Processed deletion for ${results.length} image(s).`,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error('[Upload Controller Batch Delete Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to batch delete images from Cloudinary.',
    });
  }
}

export default {
  uploadBikeImages,
  deleteBikeImage,
  batchDeleteBikeImages,
};

