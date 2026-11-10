import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../src/config/db.js';
import { BikeModel } from '../src/models/Bike.js';

async function listAll() {
  await connectDB();
  const bikes = await BikeModel.find({}).sort({ createdAt: -1 }).limit(10).lean();
  console.log(`Found ${bikes.length} bikes:`);
  bikes.forEach(b => {
    console.log(`ID: ${b._id.toString()} | Name: ${b.name} | Tagline: ${b.tagline}`);
  });
  process.exit(0);
}

listAll().catch(err => {
  console.error(err);
  process.exit(1);
});

