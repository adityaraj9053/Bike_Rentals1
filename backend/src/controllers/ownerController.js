import mongoose from 'mongoose';
import { BusinessSettingModel } from '../models/BusinessSetting.js';
import { BikeModel } from '../models/Bike.js';
import { UserModel } from '../models/User.js';
import {
  deleteMultipleImagesFromCloudinary,
  extractPublicId,
} from '../services/cloudinaryService.js';

/**
 * Get stored Business / Owner Settings (stored once)
 */
export async function getBusinessSettings(req, res) {
  try {
    let settings = await BusinessSettingModel.findOne();

    if (!settings) {
      // Find or create default owner user
      let ownerUser = await UserModel.findOne({ role: 'OWNER' });
      if (!ownerUser) {
        ownerUser = await UserModel.create({
          email: 'owner@theroadeagle.com',
          fullName: 'Fleet Operations Manager',
          phoneNumber: '9876543210',
          role: 'OWNER',
          emailVerified: true,
        });
      }

      settings = await BusinessSettingModel.create({
        ownerUserId: ownerUser._id,
        businessName: 'The Road Eagle',
        ownerFullName: ownerUser.fullName,
        contactPhone: ownerUser.phoneNumber || '+91 98765 43210',
        contactEmail: ownerUser.email,
        defaultPickupHub: {
          name: 'The Road Eagle Flagship Hub',
          address: '123 Rider Avenue, Sector 5, Bandra West',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400050',
        },
        operatingHours: {
          openTime: '07:00 AM',
          closeTime: '09:00 PM',
        },
        upiId: 'roadeagle@upi',
        rentalTerms: [
          'Mandatory at pickup: Driving licence, ID proof, 2 photos',
          '1 Helmet included complimentary with every bike rental',
          'Zero hidden charges; security deposit refunded immediately upon return inspection',
        ],
      });
    }

    return res.status(200).json({ success: true, data: settings });
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
    const updateData = req.body;
    let settings = await BusinessSettingModel.findOne();

    if (!settings) {
      const ownerUserId = req.user?.id || req.user?._id;
      settings = await BusinessSettingModel.create({
        ownerUserId,
        ...updateData,
      });
    } else {
      Object.assign(settings, updateData);
      await settings.save();
    }

    return res.status(200).json({
      success: true,
      message: 'Business settings updated successfully.',
      data: settings,
    });
  } catch (error) {
    console.error('[Owner updateBusinessSettings Error]:', error);
    return res.status(500).json({ success: false, message: 'Failed to update business settings.' });
  }
}

/**
 * Owner Only: Add a new bike to fleet (uses pre-saved business info automatically)
 */
export async function createOwnerBike(req, res) {
  try {
    const data = req.body;

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
      const regNo = (data.registrationNumber || `MH-${Math.floor(1000 + Math.random() * 9000)}`).toUpperCase().trim();
      const listingCode = `RDE-${Math.floor(100000 + Math.random() * 900000)}`;
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
        rcSmartCardUrl: data.documents?.rc?.fileName || data.documents?.rcSmartCardUrl || '',
        insurancePolicyUrl: data.documents?.insurance?.fileName || data.documents?.insurancePolicyUrl || '',
        insuranceExpiryDate: data.insuranceExpiryDate ? new Date(data.insuranceExpiryDate) : null,
        pucCertificateUrl: data.documents?.puc?.fileName || data.documents?.pucCertificateUrl || '',
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
 * Owner Only: Update bike specifications or pricing
 */
export async function updateOwnerBike(req, res) {
  try {
    const { id } = req.params;
    const updateData = req.body;

    const bike = await BikeModel.findByIdAndUpdate(id, updateData, { new: true });
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
    const bike = await BikeModel.findByIdAndDelete(id);
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
