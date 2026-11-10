import { Router } from 'express';
import { handleDocumentUpload } from '../middleware/uploadMiddleware.js';
import {
  uploadUserDocument,
  uploadBikeDocument,
  getSignedUrlHandler,
  getBikeDocuments,
  deleteDocument,
} from '../controllers/documentController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = Router();

/**
 * User Identity Documents Upload (Aadhaar, Driving Licence)
 * Folders in R2:
 * - documents/users/{userId}/aadhaar/
 * - documents/users/{userId}/driving-licence/
 */
router.post('/user/:userId/:documentType', optionalAuth, handleDocumentUpload, uploadUserDocument);
router.post('/user/:documentType', optionalAuth, handleDocumentUpload, uploadUserDocument);

/**
 * Bike Compliance Documents Upload (RC, Insurance, PUC)
 * Folders in R2:
 * - documents/bikes/{bikeId}/rc/
 * - documents/bikes/{bikeId}/insurance/
 * - documents/bikes/{bikeId}/puc/
 */
router.post('/bike/:bikeId/:documentType', optionalAuth, handleDocumentUpload, uploadBikeDocument);
router.post('/bike/:documentType', optionalAuth, handleDocumentUpload, uploadBikeDocument);

/**
 * Generate Temporary Signed Download/View URL (Valid for 10-15 minutes)
 * GET /api/documents/signed-url?key=...&expiresIn=900
 * POST /api/documents/signed-url { key: "...", expiresIn: 900 }
 */
router.get('/signed-url', optionalAuth, getSignedUrlHandler);
router.post('/signed-url', optionalAuth, getSignedUrlHandler);

/**
 * Fetch signed URLs for all documents of a specific bike
 * GET /api/documents/bike/:bikeId
 */
router.get('/bike/:bikeId', optionalAuth, getBikeDocuments);

/**
 * Delete Document from Cloudflare R2
 * DELETE /api/documents { key: "..." } or DELETE /api/documents?key=...
 */
router.delete('/', optionalAuth, deleteDocument);

export default router;

