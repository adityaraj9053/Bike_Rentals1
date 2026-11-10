import {
  uploadDocumentToR2,
  getSignedDocumentUrl,
  deleteDocumentFromR2,
  buildUserDocumentKey,
  buildBikeDocumentKey,
  validateDocumentFile,
  VALID_USER_DOC_TYPES,
  VALID_BIKE_DOC_TYPES,
} from '../services/r2Service.js';
import { BikeModel } from '../models/Bike.js';
import { UserModel } from '../models/User.js';
import { RenterProfileModel } from '../models/RenterProfile.js';

/**
 * Upload a sensitive user identity document (Aadhaar, Driving Licence) to Cloudflare R2
 * POST /api/documents/user/:userId/:documentType
 * POST /api/documents/user/:documentType
 */
export async function uploadUserDocument(req, res) {
  try {
    const rawFiles = req.files || (req.file ? [req.file] : []);
    const files = Array.isArray(rawFiles) ? rawFiles : Object.values(rawFiles).flat();
    const file = files[0];

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No document file uploaded. Please provide a PDF, JPEG, or PNG file (max 10MB).',
      });
    }

    const docType = req.params.documentType || req.body.documentType;
    if (!docType || !VALID_USER_DOC_TYPES[docType.toLowerCase().trim()]) {
      return res.status(400).json({
        success: false,
        message: `Invalid document type "${docType}". Allowed types for users: aadhaar, driving-licence.`,
      });
    }

    const normalizedDocType = VALID_USER_DOC_TYPES[docType.toLowerCase().trim()];

    // Determine target userId: from params, or fallback to authenticated user
    const targetUserId = req.params.userId || req.user?._id || req.user?.id || req.body?.userId;
    if (!targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'A valid userId is required to associate with the uploaded document.',
      });
    }

    // Authorization check: If caller is authenticated, verify they are updating their own documents, or are OWNER/ADMIN
    if (req.user && req.user.role !== 'ADMIN' && req.user.role !== 'OWNER') {
      const currentUserId = String(req.user._id || req.user.id);
      if (currentUserId !== String(targetUserId)) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. You are not authorized to upload documents for another user.',
        });
      }
    }

    // Validate file strictly (PDF, JPEG, PNG, max 10MB)
    validateDocumentFile(file);

    // Build structured R2 key: documents/users/{userId}/{aadhaar|driving-licence}/{filename}
    const key = buildUserDocumentKey(targetUserId, normalizedDocType, file.originalname);

    // Upload to Cloudflare R2
    const uploadResult = await uploadDocumentToR2({
      fileBuffer: file.buffer,
      key,
      mimeType: file.mimetype,
      metadata: {
        userId: String(targetUserId),
        documentType: normalizedDocType,
        originalFilename: file.originalname,
      },
    });

    // Generate a temporary signed download/view URL (valid for 15 minutes = 900 seconds)
    const signedUrl = await getSignedDocumentUrl(key, 900);

    // Update User / RenterProfile document records if matching MongoDB doc exists
    try {
      if (normalizedDocType === 'driving-licence') {
        await UserModel.findByIdAndUpdate(targetUserId, {
          'drivingLicense.documentKey': key,
          'drivingLicense.isVerified': false, // Mark pending verification
        });
      }
    } catch (dbErr) {
      // Non-fatal if user model has strict schema or user ID is mock
      console.warn('[User Document DB Update Notice]:', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `User ${normalizedDocType} document uploaded securely to Cloudflare R2.`,
      data: {
        key: uploadResult.key,
        bucket: uploadResult.bucket,
        userId: String(targetUserId),
        documentType: normalizedDocType,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        size: uploadResult.size,
        signedUrl,
        expiresInSeconds: 900,
      },
    });
  } catch (error) {
    console.error('[Document Controller uploadUserDocument Error]:', error);
    const statusCode = error.statusCode || (error.code === 'INVALID_FILE_TYPE' || error.code === 'LIMIT_FILE_SIZE' ? 400 : 500);
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to upload user document.',
    });
  }
}

/**
 * Upload a sensitive bike compliance document (RC, Insurance, PUC) to Cloudflare R2
 * POST /api/documents/bike/:bikeId/:documentType
 */
export async function uploadBikeDocument(req, res) {
  try {
    const rawFiles = req.files || (req.file ? [req.file] : []);
    const files = Array.isArray(rawFiles) ? rawFiles : Object.values(rawFiles).flat();
    const file = files[0];

    if (!file) {
      return res.status(400).json({
        success: false,
        message: 'No document file uploaded. Please provide a PDF, JPEG, or PNG file (max 10MB).',
      });
    }

    const docType = req.params.documentType || req.body.documentType;
    if (!docType || !VALID_BIKE_DOC_TYPES[docType.toLowerCase().trim()]) {
      return res.status(400).json({
        success: false,
        message: `Invalid bike document type "${docType}". Allowed types: rc, insurance, puc.`,
      });
    }

    const normalizedDocType = VALID_BIKE_DOC_TYPES[docType.toLowerCase().trim()];
    const bikeId = req.params.bikeId || req.body.bikeId || req.user?._id || 'pending_bike';

    if (!bikeId) {
      return res.status(400).json({
        success: false,
        message: 'A valid bikeId is required to associate with the uploaded compliance document.',
      });
    }

    // Authorization: If caller is authenticated, verify role is valid
    if (req.user && !['OWNER', 'ADMIN', 'RENTER', 'USER'].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden. You are not authorized to upload vehicle compliance documents.',
      });
    }

    // Validate file strictly (PDF, JPEG, PNG, max 10MB)
    validateDocumentFile(file);

    // Build structured R2 key: documents/bikes/{bikeId}/{rc|insurance|puc}/{filename}
    const key = buildBikeDocumentKey(bikeId, normalizedDocType, file.originalname);

    // Upload to Cloudflare R2
    const uploadResult = await uploadDocumentToR2({
      fileBuffer: file.buffer,
      key,
      mimeType: file.mimetype,
      metadata: {
        bikeId: String(bikeId),
        documentType: normalizedDocType,
        originalFilename: file.originalname,
      },
    });

    // Generate a temporary signed download/view URL (valid for 15 minutes = 900 seconds)
    const signedUrl = await getSignedDocumentUrl(key, 900);

    // Sync bike document fields in MongoDB if bike exists
    try {
      const fieldMap = {
        rc: 'documents.rcSmartCardUrl',
        insurance: 'documents.insurancePolicyUrl',
        puc: 'documents.pucCertificateUrl',
      };
      const updateField = fieldMap[normalizedDocType];
      if (updateField && bikeId.match(/^[0-9a-fA-F]{24}$/)) {
        await BikeModel.findByIdAndUpdate(bikeId, {
          [updateField]: key,
        });
      }
    } catch (dbErr) {
      console.warn('[Bike Document DB Sync Notice]:', dbErr.message);
    }

    return res.status(200).json({
      success: true,
      message: `Bike ${normalizedDocType.toUpperCase()} document uploaded securely to Cloudflare R2.`,
      data: {
        key: uploadResult.key,
        bucket: uploadResult.bucket,
        bikeId: String(bikeId),
        documentType: normalizedDocType,
        originalFilename: file.originalname,
        mimeType: file.mimetype,
        size: uploadResult.size,
        signedUrl,
        expiresInSeconds: 900,
      },
    });
  } catch (error) {
    console.error('[Document Controller uploadBikeDocument Error]:', error);
    const statusCode = error.statusCode || (error.code === 'INVALID_FILE_TYPE' || error.code === 'LIMIT_FILE_SIZE' ? 400 : 500);
    return res.status(statusCode).json({
      success: false,
      message: error.message || 'Failed to upload bike document.',
    });
  }
}

/**
 * Generate a temporary expiring signed download/view URL (10-15 minutes) for a document
 * GET /api/documents/signed-url?key=...&expiresIn=900
 * POST /api/documents/signed-url { key: "...", expiresIn: 900 }
 */
export async function getSignedUrlHandler(req, res) {
  try {
    const key = req.query.key || req.body?.key;
    const requestedExpiry = req.query.expiresIn || req.body?.expiresIn || 900;

    if (!key || typeof key !== 'string' || !key.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid document "key" is required to generate a signed URL.',
      });
    }

    const cleanKey = key.trim();

    // Verify key follows safe expected patterns (documents/users/... or documents/bikes/...)
    if (!cleanKey.startsWith('documents/users/') && !cleanKey.startsWith('documents/bikes/')) {
      return res.status(400).json({
        success: false,
        message: 'Invalid document key format. Key must start with "documents/users/" or "documents/bikes/".',
      });
    }

    // Authorization checks for user documents
    if (cleanKey.startsWith('documents/users/')) {
      const parts = cleanKey.split('/');
      const docUserId = parts[2];

      if (req.user && req.user.role !== 'ADMIN' && req.user.role !== 'OWNER') {
        const currentUserId = String(req.user._id || req.user.id);
        if (currentUserId !== String(docUserId)) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden. You are not authorized to access documents belonging to another user.',
          });
        }
      }
    }

    // Clamp expiresIn between 60 seconds and 3600 seconds (default 900s = 15 mins)
    const expiresInSeconds = Math.max(60, Math.min(3600, parseInt(requestedExpiry, 10) || 900));

    const signedUrl = await getSignedDocumentUrl(cleanKey, expiresInSeconds);

    return res.status(200).json({
      success: true,
      message: `Signed URL generated successfully (valid for ${Math.round(expiresInSeconds / 60)} minutes).`,
      data: {
        key: cleanKey,
        signedUrl,
        expiresInSeconds,
        expiresAt: new Date(Date.now() + expiresInSeconds * 1000).toISOString(),
      },
    });
  } catch (error) {
    console.error('[Document Controller getSignedUrlHandler Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to generate signed document URL.',
    });
  }
}

/**
 * Retrieve active signed URLs for all documents associated with a bike
 * GET /api/documents/bike/:bikeId
 */
export async function getBikeDocuments(req, res) {
  try {
    const { bikeId } = req.params;
    if (!bikeId) {
      return res.status(400).json({ success: false, message: 'A valid bikeId is required.' });
    }

    const bike = await BikeModel.findById(bikeId).lean();
    if (!bike) {
      return res.status(404).json({ success: false, message: 'Bike not found.' });
    }

    const docs = bike.documents || {};
    const results = {};

    const resolveDocUrl = async (val) => {
      if (!val) return null;
      if (val.startsWith('documents/')) {
        return await getSignedDocumentUrl(val, 900);
      }
      return val;
    };

    results.rc = {
      keyOrUrl: docs.rcSmartCardUrl || null,
      signedUrl: await resolveDocUrl(docs.rcSmartCardUrl),
    };
    results.insurance = {
      keyOrUrl: docs.insurancePolicyUrl || null,
      expiryDate: docs.insuranceExpiryDate || null,
      signedUrl: await resolveDocUrl(docs.insurancePolicyUrl),
    };
    results.puc = {
      keyOrUrl: docs.pucCertificateUrl || null,
      expiryDate: docs.pucExpiryDate || null,
      signedUrl: await resolveDocUrl(docs.pucCertificateUrl),
    };

    return res.status(200).json({
      success: true,
      bikeId,
      documents: results,
      expiresInSeconds: 900,
    });
  } catch (error) {
    console.error('[Document Controller getBikeDocuments Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to retrieve bike documents.',
    });
  }
}

/**
 * Delete a document from Cloudflare R2
 * DELETE /api/documents
 */
export async function deleteDocument(req, res) {
  try {
    const key = req.body?.key || req.query?.key;

    if (!key || typeof key !== 'string' || !key.trim()) {
      return res.status(400).json({
        success: false,
        message: 'A valid document "key" is required to delete an object from Cloudflare R2.',
      });
    }

    const cleanKey = key.trim();

    // Authorization checks for user documents
    if (cleanKey.startsWith('documents/users/')) {
      const parts = cleanKey.split('/');
      const docUserId = parts[2];

      if (req.user && req.user.role !== 'ADMIN' && req.user.role !== 'OWNER') {
        const currentUserId = String(req.user._id || req.user.id);
        if (currentUserId !== String(docUserId)) {
          return res.status(403).json({
            success: false,
            message: 'Forbidden. You are not authorized to delete documents belonging to another user.',
          });
        }
      }
    }

    const result = await deleteDocumentFromR2(cleanKey);

    return res.status(200).json({
      success: true,
      message: `Document "${cleanKey}" was successfully removed from Cloudflare R2.`,
      data: result,
    });
  } catch (error) {
    console.error('[Document Controller deleteDocument Error]:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to delete document from Cloudflare R2.',
    });
  }
}

