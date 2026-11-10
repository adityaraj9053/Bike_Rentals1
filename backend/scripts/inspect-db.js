import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

async function inspect() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to DB:', mongoose.connection.name);
  const bikes = await mongoose.connection.collection('bikes').find({}).toArray();
  console.log(`Total bikes: ${bikes.length}`);
  for (const b of bikes) {
    console.log('----------------------------------------------------');
    console.log('ID:', b._id.toString());
    console.log('Name:', b.name);
    console.log('Model:', b.model);
    console.log('Registration:', b.registrationNumber);
    console.log('Tagline:', b.tagline);
    console.log('Images:', JSON.stringify(b.images, null, 2));
    console.log('Photos:', JSON.stringify(b.photos, null, 2));
  }
  process.exit(0);
}

inspect().catch(err => {
  console.error(err);
  process.exit(1);
});
