import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import ContactRequest from "../models/ContactRequest.js";
import Donation from "../models/Donation.js";
import FoodLog from "../models/FoodLog.js";
import ImpactStory from "../models/ImpactStory.js";
import NGO from "../models/NGO.js";
import User from "../models/User.js";

const initDb = async () => {
  await connectDB();

  const models = [User, Donation, NGO, FoodLog, ImpactStory, ContactRequest];

  for (const model of models) {
    await model.createCollection();
    await model.syncIndexes();
    console.log(`Ready: ${mongoose.connection.name}.${model.collection.collectionName}`);
  }

  console.log(`Database initialized: ${mongoose.connection.name}`);
  await mongoose.connection.close();
};

initDb().catch(async (error) => {
  console.error("Database initialization failed:", error.message);
  await mongoose.connection.close();
  process.exit(1);
});
