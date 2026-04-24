import mongoose from "mongoose";
import { connectDB } from "../config/db.js";
import Donation from "../models/Donation.js";
import ImpactStory from "../models/ImpactStory.js";
import NGO from "../models/NGO.js";
import User from "../models/User.js";
import { donations, impactStories, ngos, users } from "./seedData.js";

const seed = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    NGO.deleteMany({}),
    ImpactStory.deleteMany({}),
    Donation.deleteMany({}),
  ]);

  const createdUsers = await User.insertMany(users);
  const userByEmail = new Map(createdUsers.map((user) => [user.email, user]));

  await NGO.insertMany(ngos);
  await ImpactStory.insertMany(impactStories);
  await Donation.insertMany(
    donations.map(({ donorEmail, acceptedByNgoEmail, ...donation }) => ({
      ...donation,
      donor: donorEmail ? userByEmail.get(donorEmail)?._id : undefined,
      acceptedByNgo: acceptedByNgoEmail ? userByEmail.get(acceptedByNgoEmail)?._id : undefined,
    }))
  );

  console.log("Seed data inserted.");
  await mongoose.connection.close();
};

seed().catch(async (error) => {
  console.error("Seed failed:", error.message);
  await mongoose.connection.close();
  process.exit(1);
});
