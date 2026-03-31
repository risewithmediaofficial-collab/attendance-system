import mongoose from "mongoose";

export async function connectMongo(): Promise<void> {
  const uri = process.env.MONGODB_URI?.trim();
  if (!uri) {
    throw new Error(
      "MONGODB_URI is not set. Copy server/.env.example to server/.env and paste your MongoDB Atlas connection string.",
    );
  }
  if (!uri.startsWith("mongodb+srv://")) {
    throw new Error(
      "This project is configured for MongoDB Atlas only. Use a mongodb+srv:// URI from Atlas (Connect → Drivers).",
    );
  }
  mongoose.set("strictQuery", true);
  await mongoose.connect(uri);
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}
