import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

async function findDoc() {
  await mongoose.connect(process.env.MONGODB_URI);
  const admin = mongoose.connection.db.admin();
  const dbs = await admin.listDatabases();
  console.log('Databases:', dbs.databases.map(d => d.name));

  for (const dbInfo of dbs.databases) {
    const db = mongoose.connection.client.db(dbInfo.name);
    const collections = await db.listCollections().toArray();
    for (const c of collections) {
      const match = await db.collection(c.name).findOne({
        $or: [
          { tagline: 'hgjmhbkjnj' },
          { tagline: 'dsfdvfvfgb' },
          { 'images.rear': { $regex: 'fjm5kofgbkuhjht23kuu' } }
        ]
      });
      if (match) {
        console.log(`FOUND in DB [${dbInfo.name}] Collection [${c.name}]:`);
        console.log(JSON.stringify(match, null, 2));
      }
    }
  }
  process.exit(0);
}

findDoc().catch(err => {
  console.error(err);
  process.exit(1);
});

