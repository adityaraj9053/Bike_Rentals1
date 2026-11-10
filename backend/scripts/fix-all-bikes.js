import dotenv from 'dotenv';
dotenv.config();
import { connectDB } from '../src/config/db.js';
import { BikeModel } from '../src/models/Bike.js';

async function updateAllBikes() {
  await connectDB();
  const bikes = await BikeModel.find({}).lean();
  console.log(`Found ${bikes.length} bikes in database.`);

  const himalayanImages = {
    front: 'https://res.cloudinary.com/dmflrvkpv/image/upload/v1794306042/bike_images/jwvl7mmnjwcs6nkbwvc6.jpg',
    rear: 'https://res.cloudinary.com/dmflrvkpv/image/upload/v1794306075/bike_images/fjm5kofgbkuhjht23kuu.jpg',
    left: 'https://res.cloudinary.com/dmflrvkpv/image/upload/v1794306057/bike_images/i0o53veqpzavyw29am2f.jpg',
    right: 'https://res.cloudinary.com/dmflrvkpv/image/upload/v1794306069/bike_images/fxmrftnpbpatnoqerlnw.jpg',
    thumbnail: 'https://res.cloudinary.com/dmflrvkpv/image/upload/v1794306042/bike_images/jwvl7mmnjwcs6nkbwvc6.jpg',
  };

  const dukeImages = {
    front: 'https://res.cloudinary.com/dmflrvkpv/image/upload/v1794303269/bike_images/rxpvulonipiqenmvm7dp.jpg',
    rear: 'https://res.cloudinary.com/dmflrvkpv/image/upload/v1794303271/bike_images/ztn1fhyoniqr0voplzu2.jpg',
    left: 'https://res.cloudinary.com/dmflrvkpv/image/upload/v1794303288/bike_images/lpkn9pyy2yh4m0qvvfmr.jpg',
    right: 'https://res.cloudinary.com/dmflrvkpv/image/upload/v1794303300/bike_images/bqjqwptaf3zemlf02djz.jpg',
    thumbnail: 'https://res.cloudinary.com/dmflrvkpv/image/upload/v1794303269/bike_images/rxpvulonipiqenmvm7dp.jpg',
  };

  for (const b of bikes) {
    const isHimalayan = (b.model && /himalayan/i.test(b.model)) || (b.tagline && /hgjmhbkjnj/i.test(b.tagline));
    const isDuke = (b.model && /duke/i.test(b.model)) || (b.tagline && /dsfdvfvfgb/i.test(b.tagline));

    let targetImages = null;
    if (isHimalayan) targetImages = himalayanImages;
    else if (isDuke) targetImages = dukeImages;

    if (targetImages) {
      await BikeModel.findByIdAndUpdate(b._id, {
        images: targetImages,
        photos: targetImages,
      });
      console.log(`Updated bike [${b._id}] ${b.name || b.model} with all 4 Cloudinary images!`);
    }
  }

  const updatedBikes = await BikeModel.find({}).lean();
  updatedBikes.forEach((b) => {
    console.log(`[${b._id}] ${b.name || b.model}:`);
    console.log('Images:', JSON.stringify(b.images, null, 2));
  });

  process.exit(0);
}

updateAllBikes().catch((err) => {
  console.error(err);
  process.exit(1);
});

