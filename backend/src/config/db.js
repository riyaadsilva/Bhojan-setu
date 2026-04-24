import mongoose from "mongoose";
import { env } from "./env.js";

export const connectDB = async () => {
  if (!env.mongoUri) {
    throw new Error("MONGODB_URI is missing. Add it to backend/.env before starting the server.");
  }

  mongoose.set("strictQuery", true);
  await mongoose.connect(env.mongoUri, { dbName: env.mongoDbName });
  console.log(`MongoDB connected: ${mongoose.connection.name}`);
};
