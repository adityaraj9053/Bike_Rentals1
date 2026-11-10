import { UserModel } from '../models/User.js';
import { OwnerProfileModel } from '../models/OwnerProfile.js';
import { RenterProfileModel } from '../models/RenterProfile.js';
import { HubModel } from '../models/Hub.js';
import { BikeModel } from '../models/Bike.js';
import { BookingModel } from '../models/Booking.js';
import { PaymentTransactionModel } from '../models/PaymentTransaction.js';
import { PlatformSettingModel } from '../models/PlatformSetting.js';
import { SupportTicketModel } from '../models/SupportTicket.js';
import { BusinessSettingModel } from '../models/BusinessSetting.js';

export async function seedInitialData(req, res) {
  try {
    const existingBikes = await BikeModel.countDocuments();
    if (existingBikes > 0) {
      return res.status(200).json({
        success: true,
        message: 'Database already has records, seed skipped to preserve existing data.',
      });
    }

    console.log('[Seed] Seeding initial data into MongoDB Atlas...');

    // 1. Seed Admin User
    const adminUser = await UserModel.findOneAndUpdate(
      { email: 'admin@theroadeagle.com' },
      {
        email: 'admin@theroadeagle.com',
        fullName: 'System Administrator',
        phoneNumber: '9876543210',
        role: 'ADMIN',
        emailVerified: true,
      },
      { upsert: true, new: true }
    );

    // 2. Seed Hubs
    const hubsData = [
      {
        city: 'Mumbai',
        hubName: 'Bandra West Hub',
        address: 'B-12, Hill Road, Near Bandra Station West, Mumbai',
        pincode: '400050',
        location: { type: 'Point', coordinates: [72.8362, 19.0596] },
        openingTime: '07:00 AM',
        closingTime: '10:00 PM',
        contactPhone: '+91 98201 44521',
      },
      {
        city: 'Pune',
        hubName: 'Koregaon Park Hub',
        address: 'Plot 4, Lane 7, Koregaon Park, Pune',
        pincode: '411001',
        location: { type: 'Point', coordinates: [73.8938, 18.5362] },
        openingTime: '07:00 AM',
        closingTime: '10:00 PM',
        contactPhone: '+91 97654 32189',
      },
      {
        city: 'Bengaluru',
        hubName: 'Indiranagar Hub',
        address: '88, 100 Feet Road, HAL 2nd Stage, Indiranagar, Bengaluru',
        pincode: '560038',
        location: { type: 'Point', coordinates: [77.6412, 12.9716] },
        openingTime: '07:00 AM',
        closingTime: '10:00 PM',
        contactPhone: '+91 94120 78654',
      },
      {
        city: 'Goa',
        hubName: 'Candolim Beach Hub',
        address: 'Fort Aguada Road, Candolim, North Goa',
        pincode: '403515',
        location: { type: 'Point', coordinates: [73.7669, 15.5173] },
        openingTime: '07:00 AM',
        closingTime: '11:00 PM',
        contactPhone: '+91 98111 22334',
      },
    ];

    const hubs = await HubModel.insertMany(hubsData);

    // 3. Seed Owners
    const owner1User = await UserModel.create({
      email: 'vikram.malhotra@gmail.com',
      fullName: 'Vikram Malhotra',
      phoneNumber: '9820144521',
      role: 'OWNER',
      emailVerified: true,
    });

    const owner1 = await OwnerProfileModel.create({
      userId: owner1User._id,
      businessName: 'Malhotra Moto Rentals',
      panNumber: 'ABCDE1234F',
      aadhaarLastFour: '8912',
      bankAccountEncrypted: {
        accountNumber: '918237192831',
        ifsc: 'HDFC0000123',
        accountHolderName: 'Vikram Malhotra',
        vpaUpi: 'vikram@okaxis',
      },
      kycStatus: 'VERIFIED',
      ownerRating: 4.9,
    });

    const owner2User = await UserModel.create({
      email: 'ananya.d@outlook.com',
      fullName: 'Ananya Deshmukh',
      phoneNumber: '9765432189',
      role: 'OWNER',
      emailVerified: true,
    });

    const owner2 = await OwnerProfileModel.create({
      userId: owner2User._id,
      businessName: 'Deshmukh Fleets',
      panNumber: 'PQXYZ5678K',
      aadhaarLastFour: '4421',
      kycStatus: 'PENDING_REVIEW',
      ownerRating: 5.0,
    });

    // Seed Single Business Profile (Stored Once)
    await BusinessSettingModel.findOneAndUpdate(
      { businessName: 'The Road Eagle' },
      {
        ownerUserId: owner1User._id,
        businessName: 'The Road Eagle',
        ownerFullName: 'The Road Eagle Fleet',
        contactPhone: '+91 98765 43210',
        contactEmail: 'owner@theroadeagle.com',
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
      },
      { upsert: true, new: true }
    );

    // 4. Seed Fleet Bikes
    const bikesData = [
      {
        listingCode: 'RDE-942810',
        ownerId: owner1._id,
        assignedHubId: hubs[0]._id,
        brand: 'Royal Enfield',
        model: 'Meteor 350',
        manufacturingYear: 2024,
        category: 'Cruiser Bikes',
        registrationNumber: 'MH 02 FJ 9042',
        chassisNumber: 'ME3H450XXXX88291',
        engineNumber: 'H450E882910',
        engineCapacityCc: 349,
        fuelType: 'Petrol',
        transmission: 'Manual',
        color: 'Fireball Yellow',
        specs: {
          displacement: '349.34 CC',
          power: '20.2 BHP @ 6100 rpm',
          transmission: '5-Speed Manual',
          fuelSystem: 'Electronic Fuel Injection',
          tankCapacity: '15 Liters',
          mileage: '35-40 kmpl',
          seating: '2 Persons',
          weight: '191 kg',
          braking: 'Dual Channel ABS',
          fuelType: 'Petrol',
        },
        features: [
          'Ergonomic Low-Slung Touring Seat',
          'Tripper Navigation Display Support',
          'Dual Disc Brakes with ABS',
          'Pillion Backrest for Passenger Comfort',
          'USB Charging Port On-Board',
        ],
        dailyPrice: 1500,
        securityDeposit: 3000,
        minDurationDays: 1,
        maxDurationDays: 30,
        pickupAddress: 'Bandra West Hub, Mumbai',
        photos: {
          front: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
          rear: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
          left: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
          right: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
        },
        status: 'APPROVED',
        isAvailable: true,
      },
      {
        listingCode: 'RDE-942811',
        ownerId: owner1._id,
        assignedHubId: hubs[0]._id,
        brand: 'Hero',
        model: 'Splendor Pro 150',
        manufacturingYear: 2023,
        category: 'Scooters & Commuters',
        registrationNumber: 'MH 02 CK 4412',
        chassisNumber: 'MBLHA10XXXX77123',
        engineNumber: 'HA10E77123',
        engineCapacityCc: 149,
        dailyPrice: 800,
        securityDeposit: 2000,
        pickupAddress: 'Bandra West Hub, Mumbai',
        photos: {
          front: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
          rear: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
          left: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
          right: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
        },
        status: 'APPROVED',
        isAvailable: true,
      },
      {
        listingCode: 'RDE-942812',
        ownerId: owner2._id,
        assignedHubId: hubs[1]._id,
        brand: 'KTM',
        model: 'Duke 390 Track Edition',
        manufacturingYear: 2024,
        category: 'Sports & Track',
        registrationNumber: 'MH 12 TK 9901',
        chassisNumber: 'VBKJP44XXXX99823',
        engineNumber: 'JP44E99823',
        engineCapacityCc: 399,
        dailyPrice: 2200,
        securityDeposit: 5000,
        pickupAddress: 'Koregaon Park Hub, Pune',
        photos: {
          front: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
          rear: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
          left: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
          right: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
        },
        status: 'APPROVED',
        isAvailable: true,
      },
      {
        listingCode: 'RDE-942813',
        ownerId: owner1._id,
        assignedHubId: hubs[0]._id,
        brand: 'Royal Enfield',
        model: 'Himalayan 450',
        manufacturingYear: 2024,
        category: 'Adventure Tourer',
        registrationNumber: 'MH 02 HL 4501',
        chassisNumber: 'ME3H450XXXX11223',
        engineNumber: 'H450E11223',
        engineCapacityCc: 452,
        dailyPrice: 1800,
        securityDeposit: 4000,
        pickupAddress: 'Bandra West Hub, Mumbai',
        photos: {
          front: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80',
          rear: 'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?w=800&auto=format&fit=crop&q=80',
          left: 'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?w=800&auto=format&fit=crop&q=80',
          right: 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80',
          thumbnail: 'https://images.unsplash.com/photo-1558980664-769d59546b3d?w=800&auto=format&fit=crop&q=80',
        },
        status: 'APPROVED',
        isAvailable: true,
      },
    ];

    const bikes = await BikeModel.insertMany(bikesData);

    // 5. Seed Renter & Sample Booking
    const renterUser = await UserModel.create({
      email: 'rohit.sharma@gmail.com',
      fullName: 'Rohit Sharma',
      phoneNumber: '9819012345',
      role: 'RENTER',
      emailVerified: true,
    });

    const renterProfile = await RenterProfileModel.create({
      userId: renterUser._id,
      dateOfBirth: new Date('1996-05-14'),
      dlNumber: 'MH-02-2018-0091823',
      dlExpiryDate: new Date('2038-05-14'),
      dlClass: 'MCWG',
      kycStatus: 'VERIFIED',
    });

    const booking = await BookingModel.create({
      bookingCode: 'RDE-784920',
      bikeId: bikes[0]._id,
      renterId: renterProfile._id,
      ownerId: owner1._id,
      pickupDatetime: new Date(),
      returnDatetime: new Date(Date.now() + 2 * 24 * 3600 * 1000),
      durationDays: 2,
      financials: {
        dailyRate: 1500,
        rentalSubtotal: 3000,
        deliveryFee: 0,
        platformCommissionFee: 300,
        ownerPayoutAmount: 2700,
        securityDeposit: 3000,
        totalAmountPaid: 6000,
      },
      bookingStatus: 'ACTIVE',
      paymentStatus: 'PAID_ESCROW',
      escrowStatus: 'HELD_IN_ESCROW',
    });

    await PaymentTransactionModel.create({
      bookingId: booking._id,
      userId: renterUser._id,
      amountInr: 6000,
      currency: 'INR',
      gatewayProvider: 'RAZORPAY',
      status: 'SUCCESSFUL',
    });

    // 6. Seed Platform Settings
    const settings = [
      { key: 'platformCommissionPercent', value: 10, description: 'Commission fee deducted from host rentals' },
      { key: 'minimumRiderAge', value: 18, description: 'Strict minimum age limit enforced at signup' },
      { key: 'defaultSecurityDeposit', value: 3000, description: 'Default deposit for standard cruisers' },
      { key: 'otpExpirySeconds', value: 300, description: 'Email OTP lifetime in seconds' },
    ];
    await PlatformSettingModel.insertMany(settings);

    console.log('[Seed] Seeding completed successfully!');
    return res.status(200).json({
      success: true,
      message: 'MongoDB Atlas initial data seeded successfully!',
      seeded: {
        hubs: hubs.length,
        bikes: bikes.length,
        owners: 2,
        renters: 1,
        bookings: 1,
      },
    });
  } catch (error) {
    console.error('[Seed Error]:', error);
    return res.status(500).json({ success: false, message: error.message || 'Seeding failed.' });
  }
}

