import mongoose from 'mongoose';

export async function connectDB() {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('MongoDB configuration error: MONGO_URI is not set in environment.');
    return false;
  }

  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 4000
    });
    console.log(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.error(`MongoDB connection failed: ${error.message}`);
    return false;
  }
}
