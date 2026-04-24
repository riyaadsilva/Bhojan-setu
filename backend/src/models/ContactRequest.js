import mongoose from "mongoose";

const contactRequestSchema = new mongoose.Schema(
  {
    ngo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NGO",
      required: true,
    },
    donor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    donation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Donation",
    },
    donorName: String,
    donorPhone: String,
    donorEmail: String,
    donorLocation: String,
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ["sent", "viewed", "accepted", "closed"],
      default: "sent",
    },
  },
  { timestamps: true }
);

const ContactRequest = mongoose.model("ContactRequest", contactRequestSchema);

export default ContactRequest;
