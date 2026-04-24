import bcrypt from "bcryptjs";
import mongoose from "mongoose";

const profileSchema = new mongoose.Schema(
  {
    name: String,
    birthDate: Date,
    phone: String,
    email: String,
    location: String,
    businessName: String,
    ownerName: String,
    establishedDate: Date,
    fssai: String,
    address: String,
    cuisine: String,
    ngoName: String,
    regNumber: String,
    website: String,
    area: String,
    cause: String,
  },
  { _id: false, strict: false }
);

const userSchema = new mongoose.Schema(
  {
    role: {
      type: String,
      enum: ["individual", "restaurant", "ngo"],
      required: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
      minlength: 6,
      select: false,
    },
    profile: {
      type: profileSchema,
      default: {},
    },
    status: {
      type: String,
      enum: ["active", "pending", "blocked"],
      default: "active",
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

export default User;
