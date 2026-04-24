import mongoose from "mongoose";

const ngoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    area: {
      type: String,
      required: true,
      trim: true,
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    lat: Number,
    lng: Number,
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
    phone: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    website: String,
    cause: String,
    distanceKm: Number,
    estimatedTravelTime: String,
    serviceRadiusKm: {
      type: Number,
      default: 10,
    },
    acceptedCategories: {
      type: [String],
      default: ["healthy", "normal", "junk"],
    },
    maxPickupQuantityKg: Number,
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 0,
    },
    mealsServed: {
      type: Number,
      default: 0,
    },
    description: String,
    image: String,
    verified: {
      type: Boolean,
      default: true,
    },
    pickupReadiness: {
      liveStatus: {
        type: String,
        enum: ["available", "busy", "offline"],
        default: "available",
      },
      activeVolunteers: {
        type: Number,
        default: 0,
      },
      supportsDriverTracking: {
        type: Boolean,
        default: true,
      },
      supportsGeofenceConfirmation: {
        type: Boolean,
        default: true,
      },
    },
  },
  { timestamps: true }
);

ngoSchema.index({ location: "2dsphere" });
ngoSchema.pre("validate", function setNGOLocation(next) {
  if (Number.isFinite(this.lat) && Number.isFinite(this.lng)) {
    this.location = {
      type: "Point",
      coordinates: [this.lng, this.lat],
    };
  }

  if (!this.address) {
    this.address = [this.area, this.city].filter(Boolean).join(", ");
  }

  next();
});

const NGO = mongoose.model("NGO", ngoSchema);

export default NGO;
