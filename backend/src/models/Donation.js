import mongoose from "mongoose";

const ngoActionSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ["accepted", "denied", "fulfillment_selected", "completed", "cancelled"],
      required: true,
    },
    actor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    actorRole: String,
    status: String,
    fulfillmentType: {
      type: String,
      enum: ["pickup", "delivery", null],
      default: null,
    },
    note: String,
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const donationSchema = new mongoose.Schema(
  {
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    donorType: {
      type: String,
      enum: ["individual", "restaurant"],
      required: true,
    },
    donorName: {
      type: String,
      required: true,
      trim: true,
    },
    donorPhone: {
      type: String,
      required: true,
      trim: true,
    },
    donorLocation: {
      type: String,
      required: true,
      trim: true,
    },
    pickupAddress: {
      type: String,
      trim: true,
    },
    pickupLat: Number,
    pickupLng: Number,
    location: {
      type: {
        type: String,
        enum: ["Point"],
      },
      coordinates: {
        type: [Number],
      },
    },
    totalPrepared: {
      type: String,
      required: true,
    },
    remaining: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: ["junk", "normal", "healthy"],
      default: "normal",
    },
    description: String,
    photo: String,
    pickupTime: Date,
    status: {
      type: String,
      enum: ["pending", "accepted", "denied", "in_transit", "delivered", "cancelled"],
      default: "pending",
    },
    fulfillmentType: {
      type: String,
      enum: ["pickup", "delivery", null],
      default: null,
    },
    acceptedByNgo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    acceptedAt: Date,
    deniedAt: Date,
    deliveredAt: Date,
    completionConfirmed: {
      type: Boolean,
      default: false,
    },
    completionNote: String,
    deliveryProofImage: String,
    pickupConfirmedByNgo: {
      type: Boolean,
      default: false,
    },
    deliveryConfirmedByNgo: {
      type: Boolean,
      default: false,
    },
    ngoActionHistory: {
      type: [ngoActionSchema],
      default: [],
    },
    rating: {
      type: Number,
      min: 1,
      max: 5,
    },
    pickupWorkflow: {
      status: {
        type: String,
        enum: ["posted", "matched", "volunteer_assigned", "en_route", "arrived", "confirmed"],
        default: "posted",
      },
      assignedVolunteer: {
        name: String,
        phone: String,
      },
      driverLocation: {
        lat: Number,
        lng: Number,
        updatedAt: Date,
      },
      geofenceConfirmedAt: Date,
    },
  },
  { timestamps: true }
);

donationSchema.index({ location: "2dsphere" });
donationSchema.pre("validate", function setDonationLocation(next) {
  if (Number.isFinite(this.pickupLat) && Number.isFinite(this.pickupLng)) {
    this.location = {
      type: "Point",
      coordinates: [this.pickupLng, this.pickupLat],
    };
  }

  if (!this.pickupAddress && this.donorLocation) {
    this.pickupAddress = this.donorLocation;
  }

  next();
});

const Donation = mongoose.model("Donation", donationSchema);

export default Donation;
