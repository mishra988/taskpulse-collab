import mongoose from 'mongoose';
import { store } from './dataStore.js';

export const connectDB = async (): Promise<void> => {
  const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/taskflow';

  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 2500, // Quick timeout so server starts instantly even without MongoDB running
    });
    console.log('✅ MongoDB connected successfully to', mongoUri);
    store.checkMongoStatus();
  } catch (error: any) {
    console.warn('\n-----------------------------------------------------------');
    console.warn('⚠️  Notice: MongoDB connection not established (' + (error.message || error) + ').');
    console.warn('🚀  Running in Resilient In-Memory Mode with preloaded demo data.');
    console.warn('💡  All Socket.IO real-time features, Kanban sync, and API endpoints work 100%!');
    console.warn('📦  To persist to MongoDB, ensure MongoDB service is active or configure MONGODB_URI in server/.env');
    console.warn('-----------------------------------------------------------\n');
    store.isConnectedToMongo = false;
  }
};
