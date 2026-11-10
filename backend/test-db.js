import mongoose from 'mongoose';
import { connectDB, disconnectDB } from './src/config/db.js';
import * as Models from './src/models/index.js';

async function verifyModelsAndDB() {
  console.log('Testing MongoDB connection and Schemas initialization...');
  try {
    await connectDB();
    console.log(`Database connected successfully: ${mongoose.connection.name}`);

    // List all registered models
    const registeredModelNames = mongoose.modelNames();
    console.log(`Total Mongoose Models Registered: ${registeredModelNames.length}`);
    console.log('Registered Models:', registeredModelNames.join(', '));

    // Ensure indexes for each model to verify all schema indexes (2dsphere, TTL, compound) are valid
    for (const name of registeredModelNames) {
      const model = mongoose.model(name);
      await model.init();
      console.log(`✓ Schema & Indexes verified for: ${name}`);
    }

    console.log('\nAll 19+ schemas and indexes verified successfully against MongoDB Atlas!');
    await disconnectDB();
    process.exit(0);
  } catch (error) {
    console.error('Verification failed:', error);
    await disconnectDB();
    process.exit(1);
  }
}

verifyModelsAndDB();

