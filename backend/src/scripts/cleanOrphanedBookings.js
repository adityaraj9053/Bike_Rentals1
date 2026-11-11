import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const BikeSchema = new mongoose.Schema(
  {
    name: String,
    brand: String,
    model: String,
    isBooked: { type: Boolean, default: false },
    currentBookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', default: null },
    currentBookedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    currentBookedByEmail: { type: String, default: null },
  },
  { strict: false }
);

const BookingSchema = new mongoose.Schema(
  {
    bikeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bike' },
    bookingStatus: String,
  },
  { strict: false }
);

const Bike = mongoose.model('Bike', BikeSchema);
const Booking = mongoose.model('Booking', BookingSchema);

async function cleanOrphanedBookings() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found in .env');
    process.exit(1);
  }

  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(uri);
    console.log('Connected to database:', mongoose.connection.name);

    // 1. Find all active bookings in Booking collection
    const activeBookings = await Booking.find({
      bookingStatus: { $ne: 'CANCELLED' },
    }).lean();

    const validBookingIds = new Set(activeBookings.map((b) => String(b._id)));
    const validBookedBikeIds = new Set(activeBookings.map((b) => String(b.bikeId)).filter(Boolean));

    console.log(`Active bookings found in 'bookings' collection: ${activeBookings.length}`);

    // 2. Find all bikes currently flagged as isBooked: true
    const bookedBikes = await Bike.find({ isBooked: true }).lean();
    console.log(`Bikes currently flagged with isBooked=true: ${bookedBikes.length}`);

    let clearedCount = 0;
    for (const bike of bookedBikes) {
      const bikeBookingIdStr = bike.currentBookingId ? String(bike.currentBookingId) : null;
      const isOrphaned = !bikeBookingIdStr || !validBookingIds.has(bikeBookingIdStr) || !validBookedBikeIds.has(String(bike._id));

      if (isOrphaned) {
        console.log(`Reconciling orphaned bike: "${bike.name || bike.model}" (${bike._id})`);
        await Bike.updateOne(
          { _id: bike._id },
          {
            $set: {
              isBooked: false,
              currentBookingId: null,
              currentBookedByUserId: null,
              currentBookedByEmail: null,
            },
          }
        );
        clearedCount++;
      }
    }

    console.log(`\nSuccessfully cleared ${clearedCount} orphaned bike(s).`);
    console.log('All bikes in fleet are now in sync with the bookings collection.');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('Error during cleanup:', err);
    await mongoose.disconnect();
    process.exit(1);
  }
}

cleanOrphanedBookings();

