import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../src/config/db.js';
import { BikeModel } from '../src/models/Bike.js';

async function fix() {
  await connectDB();
  const bikeId = '6af2f133be950d80aef9640b';
  const updatedImages = {
    front: 'https://res.cloudinary.com/dmflrvkpv/image/upload/v1794306042/bike_images/jwvl7mmnjwcs6nkbwvc6.jpg',
    rear: 'https://res.cloudinary.com/dmflrvkpv/image/upload/v1794306075/bike_images/fjm5kofgbkuhjht23kuu.jpg',
    left: 'https://res.cloudinary.com/dmflrvkpv/image/upload/v1794306057/bike_images/i0o53veqpzavyw29am2f.jpg',
    right: 'https://res.cloudinary.com/dmflrvkpv/image/upload/v1794306069/bike_images/fxmrftnpbpatnoqerlnw.jpg',
    thumbnail: 'https://res.cloudinary.com/dmflrvkpv/image/upload/v1794306042/bike_images/jwvl7mmnjwcs6nkbwvc6.jpg',
  };

  const res = await BikeModel.findByIdAndUpdate(
    bikeId,
    {
      images: updatedImages,
      photos: updatedImages,
    },
    { new: true }
  );

  console.log('Fixed bike ID:', res._id);
  console.log('Images:', JSON.stringify(res.images, null, 2));
  process.exit(0);
}

fix().catch(err => {
  console.error(err);
  process.exit(1);
});

