import dotenv from 'dotenv';
dotenv.config();
import mongoose from 'mongoose';

async function checkDbs() {
  const conn = await mongoose.connect(process.env.MONGODB_URI);
  const admin = conn.connection.db.admin();
  const dbs = await admin.listDatabases();
  console.log('Databases:', dbs.databases.map(d => d.name));

  for (const d of dbs.databases) {
    if (['admin', 'local'].includes(d.name)) continue;
    const db = conn.connection.client.db(d.name);
    const collections = await db.listCollections().toArray();
    console.log(`DB ${d.name} collections:`, collections.map(c => c.name));
    for (const c of collections) {
      const count = await db.collection(c.name).countDocuments();
      console.log(`  - ${d.name}.${c.name}: ${count} documents`);
      if (count > 0 && c.name.toLowerCase().includes('bike')) {
        const docs = await db.collection(c.name).find({}).sort({ _id: -1 }).limit(3).toArray();
        docs.forEach(doc => {
          console.log(`    DOC [${doc._id}]: name=${doc.name}, tagline=${doc.tagline}`);
          if (doc.images) console.log(`    images:`, JSON.stringify(doc.images));
        });
      }
    }
  }
  process.exit(0);
}

checkDbs().catch(err => {
  console.error(err);
  process.exit(1);
});

