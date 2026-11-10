import { Router } from 'express';
import { handleBikeImageUpload, handleDocumentUpload } from '../middleware/uploadMiddleware.js';
import {
  uploadBikeImages,
  deleteBikeImage,
  batchDeleteBikeImages,
} from '../controllers/uploadController.js';
import {
  uploadUserDocument,
  uploadBikeDocument,
  getSignedUrlHandler,
  deleteDocument,
} from '../controllers/documentController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

/**
 * Image Upload Endpoints (Cloudinary):
 * - POST /api/upload/bike-images (Primary endpoint)
 * - POST /api/upload/ (Alias for direct root POST)
 */
router.post('/bike-images', optionalAuth, handleBikeImageUpload, uploadBikeImages);
router.post('/', optionalAuth, handleBikeImageUpload, uploadBikeImages);

/**
 * Image Deletion Endpoints (Cloudinary):
 * - DELETE /api/upload/bike-images (public_id in query or body)
 * - DELETE /api/upload/bike-images/{*publicId} (public_id in URL path including folder)
 * - DELETE /api/upload/image (convenience alias)
 * - POST /api/upload/bike-images/batch-delete (batch deletion array)
 */
router.delete('/bike-images', optionalAuth, deleteBikeImage);
router.delete('/bike-images/{*publicId}', optionalAuth, deleteBikeImage);
router.delete('/image', optionalAuth, deleteBikeImage);
router.post('/bike-images/batch-delete', optionalAuth, batchDeleteBikeImages);

/**
 * Confidential Document Endpoints (Cloudflare R2):
 * - User Documents: documents/users/{userId}/{aadhaar|driving-licence}/
 * - Bike Compliance: documents/bikes/{bikeId}/{rc|insurance|puc}/
 */
router.post('/documents/user/:userId/:documentType', optionalAuth, handleDocumentUpload, uploadUserDocument);
router.post('/documents/user/:documentType', optionalAuth, handleDocumentUpload, uploadUserDocument);
router.post('/documents/bike/:bikeId/:documentType', optionalAuth, handleDocumentUpload, uploadBikeDocument);
router.post('/documents/bike/:documentType', optionalAuth, handleDocumentUpload, uploadBikeDocument);
router.get('/documents/signed-url', optionalAuth, getSignedUrlHandler);
router.post('/documents/signed-url', optionalAuth, getSignedUrlHandler);
router.delete('/documents', optionalAuth, deleteDocument);

export default router;
