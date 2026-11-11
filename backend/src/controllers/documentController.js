import mongoose from 'mongoose';
import {
  uploadDocumentToR2,
  getSignedDocumentUrl,
  deleteDocumentFromR2,
  buildUserDocumentKey,
  buildBikeDocumentKey,
  validateDocumentFile,
  findBikeDocumentKey,
  findUserDocumentKey,
  resolveDocumentSignedUrl,
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

    // Determine target userId: prefer authenticated user, or params/body, or fallback
    let targetUserId = req.user?._id || req.user?.id || req.params.userId || req.body?.userId;

    if (!targetUserId || targetUserId === 'undefined' || targetUserId === 'null') {
      if (req.body?.email) {
        targetUserId = req.body.email.trim().toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
      } else if (req.body?.phone || req.body?.phoneNumber) {
        targetUserId = (req.body.phone || req.body.phoneNumber).trim().replace(/[^0-9]/g, '');
      } else {
        targetUserId = `rider_${Date.now()}`;
      }
    }

    // Authorization check: If caller is authenticated as RENTER/USER, ensure document belongs to them
    if (req.user && req.user.role !== 'ADMIN' && req.user.role !== 'OWNER') {
      const currentUserId = String(req.user._id || req.user.id);
      if (
        req.params.userId &&
        req.params.userId !== 'undefined' &&
        req.params.userId !== currentUserId &&
        req.params.userId !== req.user.email &&
        !req.params.userId.startsWith('rider_') &&
        !req.params.userId.startsWith('guest_')
      ) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden. You are not authorized to upload documents for another user.',
        });
      }
      // Guarantee key uses the real user ID if logged in
      targetUserId = currentUserId;
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
    if (mongoose.connection.readyState === 1 && normalizedDocType === 'driving-licence') {
      try {
        const userFilter = targetUserId.match(/^[0-9a-fA-F]{24}$/)
          ? { _id: targetUserId }
          : { email: targetUserId };
        await UserModel.findOneAndUpdate(userFilter, {
          'drivingLicense.documentKey': key,
          'drivingLicense.isVerified': false,
        }).maxTimeMS(2000);
      } catch (dbErr) {
        console.warn('[User Document DB Update Notice]:', dbErr.message);
      }
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
        fileUrl: signedUrl,
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
    const bikeId = req.params.bikeId || req.body.bikeId;

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
      if (updateField) {
        const queryFilter = bikeId.match(/^[0-9a-fA-F]{24}$/)
          ? { _id: bikeId }
          : { $or: [{ registrationNumber: bikeId.toUpperCase().trim() }, { listingCode: bikeId.trim() }] };

        await BikeModel.findOneAndUpdate(queryFilter, {
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
        fileUrl: signedUrl,
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
    const rawKey = req.query.key || req.body?.key || req.query.url || req.body?.url;
    const bikeId = req.query.bikeId || req.body?.bikeId;
    const docType = req.query.docType || req.body?.docType;
    const requestedExpiry = req.query.expiresIn || req.body?.expiresIn || 900;

    const expiresInSeconds = Math.max(60, Math.min(3600, parseInt(requestedExpiry, 10) || 900));

    // Resolve via key, or via bikeId + docType lookup
    const signedUrl = await resolveDocumentSignedUrl(rawKey, bikeId, docType, expiresInSeconds);

    if (!signedUrl) {
      return res.status(404).json({
        success: false,
        message: 'Document not found or unable to generate signed URL. Provide a valid R2 key or bikeId/docType.',
      });
    }

    return res.status(200).json({
      success: true,
      message: `Signed URL generated successfully (valid for ${Math.round(expiresInSeconds / 60)} minutes).`,
      data: {
        key: rawKey,
        signedUrl,
        fileUrl: signedUrl,
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
 * Directly open or redirect to the uploaded file in browser
 * GET /api/documents/open?key=...
 * GET /api/documents/open?bikeId=...&docType=...
 */
export async function openDocumentHandler(req, res) {
  try {
    const rawKey =
      req.query.key ||
      req.query.url ||
      req.params.filename ||
      req.params[0] ||
      req.path;
    const bikeId = req.query.bikeId || req.params.bikeId;
    const docType = req.query.docType || req.params.docType;

    const signedUrl = await resolveDocumentSignedUrl(rawKey, bikeId, docType, 900);

    if (!signedUrl) {
      const cleanKey = String(rawKey || 'Document').replace(/[<>&"]/g, '');
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Document Not Found</title>
            <meta name="viewport" content="width=device-width, initial-scale=1.0" />
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #050B14; color: #F8FAFC; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
              .card { background: #0B1528; border: 1px solid rgba(56, 189, 248, 0.2); border-radius: 16px; padding: 36px 28px; max-width: 480px; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.5); }
              h2 { color: #38BDF8; font-size: 22px; margin: 0 0 12px; font-weight: 800; }
              p { color: #94A3B8; font-size: 14px; line-height: 1.6; margin: 0 0 24px; }
              .badge { display: inline-block; background: rgba(56, 189, 248, 0.1); color: #38BDF8; padding: 6px 14px; border-radius: 999px; font-size: 12px; font-family: monospace; margin-bottom: 18px; word-break: break-all; }
              .btn { display: inline-block; background: #0284C7; color: #FFFFFF; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; }
            </style>
          </head>
          <body>
            <div class="card">
              <h2>Document Not Found</h2>
              <div class="badge">${cleanKey}</div>
              <p>The requested document could not be located in the secure Cloudflare R2 storage vault.</p>
              <a href="${process.env.CLIENT_ORIGIN?.split(',')[0] || 'https://bikeagle.vercel.app'}" class="btn">Return to The Road Eagle</a>
            </div>
          </body>
        </html>
      `);
    }

    // Redirect to the presigned Cloudflare R2 URL which directly displays the exact image or PDF
    return res.redirect(302, signedUrl);
  } catch (error) {
    console.error('[Document Controller openDocumentHandler Error]:', error);
    return res.status(500).send('Failed to open document.');
  }
}

/**
 * Direct file view endpoint for a specific bike's compliance document
 * GET /api/documents/file/:bikeId/:docType
 */
export async function getFileByBikeDoc(req, res) {
  try {
    const { bikeId, docType } = req.params;
    if (!bikeId || !docType) {
      return res.status(400).send('Bike ID and document type are required.');
    }

    let storedValue = null;
    // Check MongoDB if connected, with quick timeout
    if (mongoose.connection.readyState === 1) {
      try {
        const queryFilter = bikeId.match(/^[0-9a-fA-F]{24}$/)
          ? { _id: bikeId }
          : { $or: [{ registrationNumber: bikeId.toUpperCase().trim() }, { listingCode: bikeId.trim() }] };

        const bike = await BikeModel.findOne(queryFilter).maxTimeMS(2000).lean();
        if (bike && bike.documents) {
          const fieldMap = {
            rc: bike.documents.rcSmartCardUrl,
            insurance: bike.documents.insurancePolicyUrl,
            puc: bike.documents.pucCertificateUrl,
          };
          storedValue = fieldMap[docType.toLowerCase().trim()];
        }
      } catch (dbErr) {
        console.warn('[getFileByBikeDoc] DB check notice:', dbErr.message);
      }
    }

    // Resolves either from stored key or directly by scanning R2 bucket prefix
    const signedUrl = await resolveDocumentSignedUrl(storedValue, bikeId, docType, 900);

    if (!signedUrl) {
      return res.status(404).send(`
        <html>
          <head><title>Vehicle Document Not Found</title></head>
          <body style="font-family: sans-serif; background: #0f172a; color: #f8fafc; padding: 40px; text-align: center;">
            <h2>Vehicle Document Not Found</h2>
            <p>No verified ${docType.toUpperCase()} document exists for vehicle ${bikeId}.</p>
          </body>
        </html>
      `);
    }

    return res.redirect(302, signedUrl);
  } catch (error) {
    console.error('[Document Controller getFileByBikeDoc Error]:', error);
    return res.status(500).send('Error accessing vehicle document.');
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

    let bike = null;
    if (mongoose.connection.readyState === 1) {
      try {
        const queryFilter = bikeId.match(/^[0-9a-fA-F]{24}$/)
          ? { _id: bikeId }
          : { $or: [{ registrationNumber: bikeId.toUpperCase().trim() }, { listingCode: bikeId.trim() }] };

        bike = await BikeModel.findOne(queryFilter).maxTimeMS(2000).lean();
      } catch (dbErr) {
        console.warn('[getBikeDocuments] DB check notice:', dbErr.message);
      }
    }

    const docs = bike?.documents || {};
    const results = {};

    results.rc = {
      keyOrUrl: docs.rcSmartCardUrl || null,
      signedUrl: await resolveDocumentSignedUrl(docs.rcSmartCardUrl, bike?.registrationNumber || bikeId, 'rc', 900),
    };
    results.insurance = {
      keyOrUrl: docs.insurancePolicyUrl || null,
      expiryDate: docs.insuranceExpiryDate || null,
      signedUrl: await resolveDocumentSignedUrl(docs.insurancePolicyUrl, bike?.registrationNumber || bikeId, 'insurance', 900),
    };
    results.puc = {
      keyOrUrl: docs.pucCertificateUrl || null,
      expiryDate: docs.pucExpiryDate || null,
      signedUrl: await resolveDocumentSignedUrl(docs.pucCertificateUrl, bike?.registrationNumber || bikeId, 'puc', 900),
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
