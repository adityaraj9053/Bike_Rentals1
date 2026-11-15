import mongoose from 'mongoose';
import { BikeModel } from '../models/Bike.js';
import { BookingModel } from '../models/Booking.js';
import { BusinessSettingModel } from '../models/BusinessSetting.js';
import {
  deleteMultipleImagesFromCloudinary,
  extractPublicId,
} from '../services/cloudinaryService.js';
import {
  findBikeDocumentKey,
  resolveDocumentSignedUrl,
} from '../services/r2Service.js';

/**
 * Section 5: Dynamic Fleet Visibility Logic (Query Layer)
 * 1. Unauthenticated / Other Users: Must only see bikes that are NOT booked (isBooked: false).
 * 2. User Who Booked the Bike: Sees their booked bike with isBooked: true and isMyBooking: true.
 * 3. Owner: Sees all bikes, with complete renter details populated on booked bikes.
 */
export async function getAllBikes(req, res) {
  try {
    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({ success: true, count: 0, data: [], offline: true });
    }
    const currentUserId = req.user?._id || req.user?.id || req.query.userId;
    const currentUserEmail = (req.user?.email || req.query.email || req.headers['x-user-email'] || '')?.trim()?.toLowerCase();
    const isOwner = req.user?.role === 'OWNER';
    const { q, category, sort } = req.query;

    const baseFilter = {};

    if (category && category !== 'all') {
      const catMap = {
        cruiser: 'Cruiser Bikes',
        sports: 'Sports & Track',
        adventure: 'Adventure Tourer',
        commuter: 'Scooters & Commuters',
        scooters: 'Scooters & Commuters',
        premium: 'Cruiser Bikes',
        nakedstreetfighters: 'Sports & Track',
      };
      const mappedCategory = catMap[category.toLowerCase()] || category;
      baseFilter.category = new RegExp(mappedCategory, 'i');
    }

    if (q && q.trim()) {
      const searchRegex = new RegExp(q.trim(), 'i');
      baseFilter.$or = [
        { brand: searchRegex },
        { model: searchRegex },
        { name: searchRegex },
        { category: searchRegex },
        { pickupAddress: searchRegex },
        { registrationNumber: searchRegex },
      ];
    }

    if (isOwner) {
      // 👑 OWNER: Sees every bike in the fleet, populated with booking and renter details
      let query = BikeModel.find(baseFilter).populate({
        path: 'currentBookingId',
        populate: [
          { path: 'renterId', select: 'fullName name email phoneNumber phone phone_number phoneCountryCode drivingLicense' },
          { path: 'bikeId' },
        ],
      });

      if (sort === 'price-asc') query = query.sort({ dailyPrice: 1 });
      else if (sort === 'price-desc') query = query.sort({ dailyPrice: -1 });
      else query = query.sort({ createdAt: -1 });

      const bikes = await query.lean();

      // 🛡️ Self-healing: if bike is flagged isBooked: true but booking does not exist in DB:
      const orphanedBikeIds = [];
      const sanitizedBikes = bikes.map((bike) => {
        const hasActiveBooking = Boolean(
          bike.currentBookingId &&
          (typeof bike.currentBookingId === 'object' ? bike.currentBookingId._id : bike.currentBookingId)
        );
        if (bike.isBooked && !hasActiveBooking) {
          orphanedBikeIds.push(bike._id);
          return {
            ...bike,
            isBooked: false,
            currentBookingId: null,
            currentBookedByUserId: null,
            currentBookedByEmail: null,
          };
        }
        if (bike.currentBookingId && typeof bike.currentBookingId === 'object') {
          bike.currentBookingId.booking_code = bike.currentBookingId.booking_code || bike.currentBookingId.bookingCode;
          bike.currentBookingId.bookingCode = bike.currentBookingId.bookingCode || bike.currentBookingId.booking_code;
        }
        return bike;
      });

      if (orphanedBikeIds.length > 0) {
        BikeModel.updateMany(
          { _id: { $in: orphanedBikeIds } },
          {
            $set: {
              isBooked: false,
              currentBookingId: null,
              currentBookedByUserId: null,
              currentBookedByEmail: null,
            },
          }
        ).catch((err) => console.warn('[Auto-Reconcile Owner] Error healing orphaned bikes:', err.message));
      }

      return res.status(200).json({ success: true, count: sanitizedBikes.length, data: sanitizedBikes });
    }

    // Find any bookings belonging to this renter (by user ID or email)
    let userBookedBikeIds = [];
    if (currentUserId || currentUserEmail) {
      const bookingFilters = [];
      if (currentUserId) {
        bookingFilters.push({ renterId: currentUserId });
        if (mongoose.Types.ObjectId.isValid(currentUserId)) {
          bookingFilters.push({ renterId: new mongoose.Types.ObjectId(currentUserId) });
        }
      }
      if (currentUserEmail) {
        bookingFilters.push({ 'riderDetails.email': new RegExp(`^${currentUserEmail.trim()}$`, 'i') });
      }

      const activeBookings = await BookingModel.find({
        $or: bookingFilters,
        bookingStatus: { $ne: 'CANCELLED' },
      }).select('bikeId').lean();

      userBookedBikeIds = activeBookings.map((b) => b.bikeId).filter(Boolean);
    }

    let visibilityQuery = {};
    if (currentUserId || currentUserEmail) {
      const userObjId = currentUserId && mongoose.Types.ObjectId.isValid(currentUserId)
        ? new mongoose.Types.ObjectId(currentUserId)
        : null;

      visibilityQuery = {
        $or: [
          { isBooked: false },
          ...(currentUserId ? [{ isBooked: true, currentBookedByUserId: currentUserId }] : []),
          ...(userObjId ? [{ isBooked: true, currentBookedByUserId: userObjId }] : []),
          ...(currentUserEmail ? [{ isBooked: true, currentBookedByEmail: new RegExp(`^${currentUserEmail.trim()}$`, 'i') }] : []),
          ...(userBookedBikeIds.length > 0 ? [{ _id: { $in: userBookedBikeIds } }] : []),
        ],
      };
    } else {
      // 🌐 GUEST / NOT LOGGED IN:
      // Only sees unbooked bikes
      visibilityQuery = { isBooked: false };
    }

    const finalFilter = Object.keys(baseFilter).length > 0
      ? { $and: [baseFilter, visibilityQuery] }
      : visibilityQuery;

    let query = BikeModel.find(finalFilter).populate({
      path: 'currentBookingId',
      populate: [
        { path: 'renterId', select: 'fullName name email phoneNumber phone phone_number phoneCountryCode drivingLicense' },
        { path: 'bikeId' },
      ],
    });
    if (sort === 'price-asc') query = query.sort({ dailyPrice: 1 });
    else if (sort === 'price-desc') query = query.sort({ dailyPrice: -1 });
    else query = query.sort({ createdAt: -1 });

    const bikes = await query.lean();
    const userBookedIdStrings = userBookedBikeIds.map((id) => String(id));

    // 🛡️ Self-healing & formatting:
    // If a bike is marked isBooked: true, but its booking was deleted from the 'bookings' collection,
    // automatically heal it so it is never shown as booked.
    const orphanedBikeIds = [];
    const formattedBikes = bikes.map((bike) => {
      const hasActiveBooking = Boolean(
        bike.currentBookingId &&
        (typeof bike.currentBookingId === 'object' ? bike.currentBookingId._id : bike.currentBookingId)
      );

      if (bike.isBooked && !hasActiveBooking) {
        orphanedBikeIds.push(bike._id);
        return {
          ...bike,
          isBooked: false,
          currentBookingId: null,
          currentBookedByUserId: null,
          currentBookedByEmail: null,
          isMyBooking: false,
        };
      }

      const bookedEmail = (
        bike.currentBookedByEmail ||
        bike.currentBookingId?.riderDetails?.email ||
        bike.currentBookingId?.renterId?.email
      )?.toLowerCase();

      const isMy = Boolean(
        hasActiveBooking && (
          (currentUserId && String(bike.currentBookedByUserId) === String(currentUserId)) ||
          userBookedIdStrings.includes(String(bike._id)) ||
          (currentUserEmail && bookedEmail && bookedEmail === currentUserEmail.toLowerCase())
        )
      );
      if (bike.currentBookingId && typeof bike.currentBookingId === 'object') {
        bike.currentBookingId.booking_code = bike.currentBookingId.booking_code || bike.currentBookingId.bookingCode;
        bike.currentBookingId.bookingCode = bike.currentBookingId.bookingCode || bike.currentBookingId.booking_code;
      }
      return {
        ...bike,
        currentBookedByEmail: bookedEmail,
        isMyBooking: isMy,
      };
    });

    if (orphanedBikeIds.length > 0) {
      BikeModel.updateMany(
        { _id: { $in: orphanedBikeIds } },
        {
          $set: {
            isBooked: false,
            currentBookingId: null,
            currentBookedByUserId: null,
            currentBookedByEmail: null,
          },
        }
      ).catch((err) => console.warn('[Auto-Reconcile] Error healing orphaned bikes:', err.message));
    }

    return res.status(200).json({ success: true, count: formattedBikes.length, data: formattedBikes });
  } catch (error) {
    console.error('[Bike getAllBikes Error]:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to fetch motorbikes.' });
  }
}

/**
 * Get single bike by ID or listing code
 */
export async function getBikeById(req, res) {
  try {
    const { id } = req.params;
    let bike = null;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      bike = await BikeModel.findById(id)
        .populate({
          path: 'currentBookingId',
          populate: { path: 'renterId', select: 'fullName email phoneNumber drivingLicense' },
        })
        .lean();
    } else {
      bike = await BikeModel.findOne({
        $or: [{ listingCode: id }, { registrationNumber: id.toUpperCase() }],
      })
        .populate({
          path: 'currentBookingId',
          populate: { path: 'renterId', select: 'fullName email phoneNumber drivingLicense' },
        })
        .lean();
    }

    if (!bike) {
      return res.status(404).json({ success: false, message: 'Motorcycle not found.' });
    }

    const hasActiveBooking = Boolean(
      bike.currentBookingId &&
      (typeof bike.currentBookingId === 'object' ? bike.currentBookingId._id : bike.currentBookingId)
    );

    if (bike.isBooked && !hasActiveBooking) {
      bike.isBooked = false;
      bike.currentBookingId = null;
      bike.currentBookedByUserId = null;
      bike.currentBookedByEmail = null;
      BikeModel.updateOne(
        { _id: bike._id },
        {
          $set: {
            isBooked: false,
            currentBookingId: null,
            currentBookedByUserId: null,
            currentBookedByEmail: null,
          },
        }
      ).catch(() => {});
    }

    const currentUserId = req.user?._id || req.user?.id;

    // Resolve live Cloudflare R2 signed URLs for bike compliance documents
    const regNo = bike.registrationNumber || bike._id;
    const docs = bike.documents || {};
    const resolvedDocs = {
      ...docs,
      rcSmartCardUrl: await resolveDocumentSignedUrl(docs.rcSmartCardUrl, regNo, 'rc') || docs.rcSmartCardUrl,
      insurancePolicyUrl: await resolveDocumentSignedUrl(docs.insurancePolicyUrl, regNo, 'insurance') || docs.insurancePolicyUrl,
      pucCertificateUrl: await resolveDocumentSignedUrl(docs.pucCertificateUrl, regNo, 'puc') || docs.pucCertificateUrl,
      rcDirectUrl: `/api/documents/file/${encodeURIComponent(regNo)}/rc`,
      insuranceDirectUrl: `/api/documents/file/${encodeURIComponent(regNo)}/insurance`,
      pucDirectUrl: `/api/documents/file/${encodeURIComponent(regNo)}/puc`,
    };

    const formatted = {
      ...bike,
      documents: resolvedDocs,
      isMyBooking: Boolean(
        hasActiveBooking && currentUserId && String(bike.currentBookedByUserId) === String(currentUserId)
      ),
    };

    return res.status(200).json({ success: true, data: formatted });
  } catch (error) {
    console.error('[Bike getBikeById Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch motorcycle details.' });
  }
}

/**
 * Create or submit bike listing (inherits stored business settings)
 */
export async function createBikeListing(req, res) {
  try {
    const data = req.body;
    let businessSettings = await BusinessSettingModel.findOne();
    const defaultAddress = businessSettings?.defaultPickupHub?.address || '123 Rider Avenue, Sector 5, Bandra West';
    const pickupAddress = data.pickupAddress || data.pickupLocation || defaultAddress;

    const regNo = (data.registrationNumber || `MH-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase().trim();
    const listingCode = `RDE-${Math.floor(100000 + Math.random() * 900000)}`;

    console.log('[Bike Controller] Creating bike listing with images payload:', JSON.stringify(data.images || data.photos, null, 2));

    const sanitizeImg = (val, fallback) => {
      if (typeof val === 'string' && val.trim() && !val.trim().startsWith('blob:')) {
        return val.trim();
      }
      return fallback;
    };

    const frontImg = sanitizeImg(data.images?.front || data.photos?.front, 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800');
    const rearImg = sanitizeImg(data.images?.rear || data.photos?.rear || data.images?.back || data.photos?.back, 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800');
    const leftImg = sanitizeImg(data.images?.left || data.photos?.left, 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800');
    const rightImg = sanitizeImg(data.images?.right || data.photos?.right, 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800');
    const thumbImg = sanitizeImg(data.images?.thumbnail || data.photos?.thumbnail, frontImg);

    const bikeImages = {
      front: frontImg,
      rear: rearImg,
      left: leftImg,
      right: rightImg,
      thumbnail: thumbImg,
    };
    const galleryList = [frontImg, rearImg, leftImg, rightImg].filter(Boolean);

    if (mongoose.connection.readyState !== 1) {
      return res.status(201).json({
        success: true,
        message: 'Motorcycle added to fleet successfully.',
        data: {
          listingCode,
          _id: listingCode,
          ...data,
          images: bikeImages,
          photos: bikeImages,
          gallery: galleryList,
          registrationNumber: regNo,
          name: data.name || `${data.brand || ''} ${data.model || ''}`.trim(),
          isBooked: false,
          status: 'APPROVED',
        },
      });
    }

    const extractDocKeyOrUrl = async (docObj, docType, reg) => {
      if (!docObj) {
        return (await findBikeDocumentKey(reg, docType)) || '';
      }
      if (typeof docObj === 'string') {
        if (docObj.startsWith('documents/') || docObj.startsWith('http')) return docObj;
        return (await findBikeDocumentKey(reg, docType)) || docObj;
      }
      if (docObj.key && docObj.key.startsWith('documents/')) return docObj.key;
      if (docObj.fileUrl && docObj.fileUrl.startsWith('http')) return docObj.fileUrl;
      if (docObj.signedUrl) return docObj.signedUrl;
      const foundInR2 = await findBikeDocumentKey(reg, docType);
      if (foundInR2) return foundInR2;
      return docObj.key || docObj.fileUrl || '';
    };

    const rcSmartCardUrl = await extractDocKeyOrUrl(data.documents?.rc, 'rc', regNo);
    const insurancePolicyUrl = await extractDocKeyOrUrl(data.documents?.insurance, 'insurance', regNo);
    const pucCertificateUrl = await extractDocKeyOrUrl(data.documents?.puc, 'puc', regNo);

    const newBike = await BikeModel.create({
      listingCode,
      name: data.name || `${data.brand || ''} ${data.model || ''}`.trim(),
      brand: data.brand || 'Motorcycle',
      model: data.model || 'Standard Edition',
      manufacturingYear: Number(data.manufacturingYear) || new Date().getFullYear(),
      category: data.category || 'Cruiser Bikes',
      registrationNumber: regNo,
      chassisNumber: (data.chassisNumber || `CHAS-${Date.now()}`).toUpperCase(),
      engineNumber: (data.engineNumber || `ENG-${Date.now()}`).toUpperCase(),
      engineCapacityCc: Number(data.engineCapacityCc || data.engineCapacity) || 350,
      fuelType: data.fuelType || 'Petrol',
      transmission: data.transmission || 'Manual',
      color: data.color || data.colour || 'Black',
      tagline: data.tagline || data.description || 'Verified Machine with full inspection',
      dailyPrice: Number(data.dailyPrice || data.pricePerDay) || 1500,
      securityDeposit: Number(data.securityDeposit || data.deposit) || 3000,
      specs: data.specs || {},
      features: data.features || (data.rulesList ? data.rulesList : []),
      pickupAddress,
      doorstepDeliveryAvailable: Boolean(data.doorstepDeliveryAvailable || data.deliveryAvailable),
      doorstepDeliveryFee: Number(data.doorstepDeliveryFee || 0),
      images: bikeImages,
      photos: bikeImages,
      gallery: galleryList,
      documents: {
        rcSmartCardUrl,
        insurancePolicyUrl,
        insuranceExpiryDate: data.insuranceExpiryDate ? new Date(data.insuranceExpiryDate) : null,
        pucCertificateUrl,
        pucExpiryDate: data.pucExpiryDate ? new Date(data.pucExpiryDate) : null,
      },
      isBooked: false,
      status: 'APPROVED',
      isFeatured: true,
      rating: 5.0,
      reviewsCount: 0,
    });

    return res.status(201).json({
      success: true,
      message: 'Motorcycle added to fleet successfully.',
      data: newBike,
    });
  } catch (error) {
    console.error('[Bike createBikeListing Error]:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to create listing.' });
  }
}

/**
 * Update bike status or details
 */
export async function updateBike(req, res) {
  try {
    const { id } = req.params;
    const data = req.body;

    const sanitizeImg = (val, fallback) => {
      if (typeof val === 'string' && val.trim() && !val.trim().startsWith('blob:')) {
        return val.trim();
      }
      return fallback;
    };

    const frontImg = sanitizeImg(data.images?.front || data.photos?.front, data.image);
    const rearImg = sanitizeImg(data.images?.rear || data.photos?.rear || data.images?.back || data.photos?.back, undefined);
    const leftImg = sanitizeImg(data.images?.left || data.photos?.left, undefined);
    const rightImg = sanitizeImg(data.images?.right || data.photos?.right, undefined);
    const thumbImg = sanitizeImg(data.images?.thumbnail || data.photos?.thumbnail, frontImg);

    const updateFields = { ...data };

    if (data.brand || data.model) {
      updateFields.name = data.name || `${data.brand || ''} ${data.model || ''}`.trim();
    }
    if (data.manufacturingYear) updateFields.manufacturingYear = Number(data.manufacturingYear);
    if (data.engineCapacityCc || data.engineCapacity) updateFields.engineCapacityCc = Number(data.engineCapacityCc || data.engineCapacity);
    if (data.dailyPrice || data.pricePerDay) updateFields.dailyPrice = Number(data.dailyPrice || data.pricePerDay);
    if (data.securityDeposit || data.deposit) updateFields.securityDeposit = Number(data.securityDeposit || data.deposit);
    if (data.colour || data.color) updateFields.color = data.colour || data.color;
    if (data.description || data.tagline) updateFields.tagline = data.description || data.tagline;
    if (data.rulesList) updateFields.features = data.rulesList;
    if (data.deliveryAvailable !== undefined) updateFields.doorstepDeliveryAvailable = Boolean(data.deliveryAvailable || data.doorstepDeliveryAvailable);

    if (frontImg || rearImg || leftImg || rightImg) {
      const bikeImages = {
        ...(data.images || {}),
        ...(frontImg ? { front: frontImg } : {}),
        ...(rearImg ? { rear: rearImg } : {}),
        ...(leftImg ? { left: leftImg } : {}),
        ...(rightImg ? { right: rightImg } : {}),
        ...(thumbImg ? { thumbnail: thumbImg } : {}),
      };
      updateFields.images = bikeImages;
      updateFields.photos = bikeImages;
      const galleryList = [frontImg, rearImg, leftImg, rightImg].filter(Boolean);
      if (galleryList.length > 0) updateFields.gallery = galleryList;
    }

    if (data.documents) {
      const docs = data.documents;
      updateFields.documents = {
        rcSmartCardUrl: typeof docs.rc === 'string' ? docs.rc : (docs.rc?.fileUrl || docs.rc?.signedUrl || docs.rcSmartCardUrl || ''),
        insurancePolicyUrl: typeof docs.insurance === 'string' ? docs.insurance : (docs.insurance?.fileUrl || docs.insurance?.signedUrl || docs.insurancePolicyUrl || ''),
        pucCertificateUrl: typeof docs.puc === 'string' ? docs.puc : (docs.puc?.fileUrl || docs.puc?.signedUrl || docs.pucCertificateUrl || ''),
        insuranceExpiryDate: docs.insuranceExpiryDate || data.insuranceExpiryDate ? new Date(docs.insuranceExpiryDate || data.insuranceExpiryDate) : undefined,
        pucExpiryDate: docs.pucExpiryDate || data.pucExpiryDate ? new Date(docs.pucExpiryDate || data.pucExpiryDate) : undefined,
      };
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(200).json({
        success: true,
        message: 'Motorcycle updated successfully.',
        data: {
          _id: id,
          id,
          ...updateFields,
        },
      });
    }

    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { listingCode: id }, { registrationNumber: id }] }
      : { $or: [{ listingCode: id }, { registrationNumber: id }] };

    const bike = await BikeModel.findOneAndUpdate(query, { $set: updateFields }, { new: true });
    if (!bike) {
      return res.status(404).json({ success: false, message: 'Motorcycle not found.' });
    }

    return res.status(200).json({ success: true, message: 'Motorcycle updated successfully.', data: bike });
  } catch (error) {
    console.error('[Bike updateBike Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update motorcycle.' });
  }
}

/**
 * Remove or delete bike listing and clean up associated Cloudinary images
 */
export async function deleteBike(req, res) {
  try {
    const { id } = req.params;
    const query = mongoose.Types.ObjectId.isValid(id)
      ? { $or: [{ _id: id }, { listingCode: id }, { registrationNumber: id }] }
      : { $or: [{ listingCode: id }, { registrationNumber: id }] };

    const bike = await BikeModel.findOneAndDelete(query);
    if (!bike) {
      return res.status(404).json({ success: false, message: 'Motorcycle not found.' });
    }

    // Clean up any associated Cloudinary images
    const candidateUrls = [
      bike.images?.front,
      bike.images?.rear,
      bike.images?.left,
      bike.images?.right,
      bike.images?.thumbnail,
    ].filter(Boolean);

    const publicIdsToDelete = [
      ...new Set(
        candidateUrls
          .filter((url) => typeof url === 'string' && (url.includes('cloudinary.com') || url.startsWith('bike_images/')))
          .map((url) => extractPublicId(url))
          .filter(Boolean)
      ),
    ];

    if (publicIdsToDelete.length > 0) {
      deleteMultipleImagesFromCloudinary(publicIdsToDelete).catch((cleanupErr) => {
        console.warn('[Cloudinary Cleanup Warning]: Failed to delete some images:', cleanupErr.message);
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Motorcycle removed from fleet.',
      data: bike,
      deletedImagesCount: publicIdsToDelete.length,
    });
  } catch (error) {
    console.error('[Bike deleteBike Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove motorcycle.' });
  }
}
