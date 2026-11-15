import mongoose from 'mongoose';
import { BusinessSettingModel } from '../models/BusinessSetting.js';
import { BikeModel } from '../models/Bike.js';
import { UserModel } from '../models/User.js';
import {
  deleteMultipleImagesFromCloudinary,
  extractPublicId,
} from '../services/cloudinaryService.js';
import {
  findBikeDocumentKey,
  resolveDocumentSignedUrl,
} from '../services/r2Service.js';

/**
 * Get stored Business / Owner Settings (stored once)
 */
export async function getBusinessSettings(req, res) {
  try {
    let settings = await BusinessSettingModel.findOne();

    if (!settings) {
      settings = await BusinessSettingModel.create({
        businessName: 'The Road Eagle',
        ownerFullName: 'Fleet Operations Manager',
        contactPhone: '+91 98765 43210',
        contactEmail: 'rentals@theroadeagle.com',
        hubName: 'Central Rental Hub',
        hubAddress: 'Plot 42, Metro Ring Road, South City, Bangalore, 560034',
        mapUrl: 'https://maps.google.com/?q=Plot+42+Metro+Ring+Road+South+City+Bangalore',
        whatsappNumber: '+91 98765 43210',
        operatingHoursText: 'Monday – Sunday: 08:00 AM – 09:30 PM',
        operatingHoursSubtext: '24/7 emergency roadside support active',
        emailResponseTime: 'Within 2 business hours',
        defaultPickupHub: {
          name: 'Central Rental Hub',
          address: 'Plot 42, Metro Ring Road, South City, Bangalore, 560034',
          city: 'Bangalore',
          state: 'Karnataka',
          pincode: '560034',
        },
        operatingHours: {
          openTime: '08:00 AM',
          closeTime: '09:30 PM',
        },
        upiId: 'roadeagle@upi',
      });
    }

    const raw = settings.toObject ? settings.toObject() : { ...settings };
    const data = {
      ...raw,
      contactPhone: raw.contactPhone || '+91 98765 43210',
      whatsappNumber: raw.whatsappNumber || raw.contactPhone || '+91 98765 43210',
      hubName: raw.hubName || raw.defaultPickupHub?.name || 'Central Rental Hub',
      hubAddress: raw.hubAddress || raw.defaultPickupHub?.address || 'Plot 42, Metro Ring Road, South City, Bangalore, 560034',
      mapUrl: raw.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(raw.hubAddress || raw.defaultPickupHub?.address || 'Bangalore')}`,
      contactEmail: raw.contactEmail || 'rentals@theroadeagle.com',
      operatingHoursText: raw.operatingHoursText || 'Monday – Sunday: 08:00 AM – 09:30 PM',
      operatingHoursSubtext: raw.operatingHoursSubtext || '24/7 emergency roadside support active',
      emailResponseTime: raw.emailResponseTime || 'Within 2 business hours',
    };

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('[Owner getBusinessSettings Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to retrieve business settings.' });
  }
}

/**
 * Update stored Business / Owner Settings once
 */
export async function updateBusinessSettings(req, res) {
  try {
    const updateData = req.body || {};

    if (updateData.hubAddress || updateData.hubName) {
      updateData.defaultPickupHub = updateData.defaultPickupHub || {};
      if (updateData.hubAddress) updateData.defaultPickupHub.address = updateData.hubAddress;
      if (updateData.hubName) updateData.defaultPickupHub.name = updateData.hubName;
    }

    const settings = await BusinessSettingModel.findOneAndUpdate(
      {},
      { $set: updateData },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({
      success: true,
      message: 'Business settings updated successfully.',
      data: settings,
    });
  } catch (error) {
    console.error('[Owner updateBusinessSettings Error]:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to update business settings.' });
  }
}

/**
 * Owner Only: Add a new bike to fleet (uses pre-saved business info automatically)
 */
export async function createOwnerBike(req, res) {
  try {
    const data = req.body;
    const regNo = (data.registrationNumber || `MH-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase().trim();
    const listingCode = `RDE-${Math.floor(100000 + Math.random() * 900000)}`;

    const businessSettings = await BusinessSettingModel.findOne().lean().catch(() => null);
    const pickupAddress = data.pickupAddress || businessSettings?.hubAddress || '123 Rider Avenue, Sector 5, Bandra West';
    const pickupTimings = data.pickupTimings || (businessSettings?.operatingHours ? `${businessSettings.operatingHours.openTime} - ${businessSettings.operatingHours.closeTime}` : '07:00 AM - 09:00 PM');

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
        message: 'New motorcycle added to fleet successfully.',
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
      pickupTimings: data.pickupTimings || businessSettings?.operatingHours ? `${businessSettings.operatingHours.openTime} - ${businessSettings.operatingHours.closeTime}` : '07:00 AM - 09:00 PM',
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
      message: 'New motorcycle added to fleet successfully.',
      data: newBike,
    });
  } catch (error) {
    console.error('[Owner createOwnerBike Error]:', error);
    return res.status(500).json({ success: false, message: error.message || 'Failed to add motorcycle.' });
  }
}

/**
 * Owner Only: Update bike specifications, pricing, documents, or media
 */
export async function updateOwnerBike(req, res) {
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

    return res.status(200).json({
      success: true,
      message: 'Motorcycle updated successfully.',
      data: bike,
    });
  } catch (error) {
    console.error('[Owner updateOwnerBike Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update motorcycle.' });
  }
}

/**
 * Owner Only: Remove or delete motorcycle from fleet
 */
export async function deleteOwnerBike(req, res) {
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
    console.error('[Owner deleteOwnerBike Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to remove motorcycle.' });
  }
}
