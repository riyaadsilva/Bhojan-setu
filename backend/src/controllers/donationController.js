import Donation from "../models/Donation.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

const donationPopulate = (query) =>
  query
    .populate("donor", "role email profile")
    .populate("acceptedByNgo", "role email profile");

const createNgoActionLog = (req, action, status, extra = {}) => ({
  action,
  actor: req.user?._id,
  actorRole: req.user?.role,
  status,
  ...extra,
});

const loadDonationOrThrow = async (id) => {
  const donation = await Donation.findById(id);
  if (!donation) {
    const error = new Error("Donation not found.");
    error.statusCode = 404;
    throw error;
  }
  return donation;
};

export const getDonations = asyncHandler(async (req, res) => {
  const { status, donorType, category } = req.query;
  const filter = {};

  if (status) filter.status = status;
  if (donorType) filter.donorType = donorType;
  if (category) filter.category = category;
  logger.debug("donations:list", { requestId: req.requestId, filter });

  const donations = await donationPopulate(Donation.find(filter)).sort({ createdAt: -1 });

  res.json({ success: true, count: donations.length, data: donations });
});

export const getMyDonations = asyncHandler(async (req, res) => {
  const role = req.user?.role;
  const email = req.user?.email;
  const profile = req.user?.profile || {};

  if (!role || !email) {
    const error = new Error("Authenticated user context is required.");
    error.statusCode = 401;
    throw error;
  }

  const donorName =
    profile.name ||
    profile.businessName ||
    profile.ngoName;

  const donorPhone = profile.phone;

  let filter = {};
  if (role === "ngo") {
    filter = { acceptedByNgo: req.user._id };
  } else {
    filter = {
      donorType: role === "restaurant" ? "restaurant" : role === "individual" ? "individual" : "__none__",
      $or: [
        { donor: req.user._id },
        ...(donorName ? [{ donorName }] : []),
        ...(donorPhone ? [{ donorPhone }] : []),
      ],
    };
  }

  logger.debug("donations:mine", { requestId: req.requestId, userId: req.user._id, role, donorName, donorPhone });

  const donations = await donationPopulate(Donation.find(filter)).sort({ createdAt: -1 });
  res.json({ success: true, count: donations.length, data: donations });
});

export const createDonation = asyncHandler(async (req, res) => {
  const {
    donorType,
    donorName,
    donorPhone,
    donorLocation,
    pickupAddress,
    pickupLat,
    pickupLng,
    totalPrepared,
    remaining,
    category,
    description,
    photo,
    pickupTime,
    donor,
  } = req.body;

  const normalizedLat = pickupLat === undefined || pickupLat === "" ? undefined : Number(pickupLat);
  const normalizedLng = pickupLng === undefined || pickupLng === "" ? undefined : Number(pickupLng);
  logger.debug("donations:create_attempt", {
    requestId: req.requestId,
    donorType,
    donorName,
    category,
    hasCoordinates: normalizedLat !== undefined && normalizedLng !== undefined,
  });

  if (!donorType || !donorName || !donorPhone || !donorLocation || !totalPrepared || !remaining) {
    const error = new Error("donorType, donorName, donorPhone, donorLocation, totalPrepared, and remaining are required.");
    error.statusCode = 400;
    throw error;
  }

  if (
    (normalizedLat !== undefined && !Number.isFinite(normalizedLat)) ||
    (normalizedLng !== undefined && !Number.isFinite(normalizedLng))
  ) {
    const error = new Error("pickupLat and pickupLng must be valid coordinates.");
    error.statusCode = 400;
    throw error;
  }

  const donation = await Donation.create({
    donor: donor || req.user?._id,
    donorType,
    donorName,
    donorPhone,
    donorLocation,
    pickupAddress: pickupAddress || donorLocation,
    pickupLat: normalizedLat,
    pickupLng: normalizedLng,
    totalPrepared,
    remaining,
    category,
    description,
    photo,
    pickupTime,
    pickupWorkflow: { status: "posted" },
  });

  logger.info("donations:create_success", {
    requestId: req.requestId,
    donationId: donation._id,
    donorType: donation.donorType,
    status: donation.status,
  });
  res.status(201).json({ success: true, data: donation });
});

export const getDonationById = asyncHandler(async (req, res) => {
  logger.debug("donations:detail", { requestId: req.requestId, donationId: req.params.id });
  const donation = await donationPopulate(Donation.findById(req.params.id));

  if (!donation) {
    const error = new Error("Donation not found.");
    error.statusCode = 404;
    throw error;
  }

  res.json({ success: true, data: donation });
});

export const acceptDonationRequest = asyncHandler(async (req, res) => {
  logger.debug("donations:accept_attempt", { requestId: req.requestId, donationId: req.params.id, ngoId: req.user?._id });

  let donation = await donationPopulate(
    Donation.findOneAndUpdate(
      { _id: req.params.id, status: "pending" },
      {
        $set: {
          status: "accepted",
          acceptedByNgo: req.user._id,
          acceptedAt: new Date(),
          fulfillmentType: null,
          deniedAt: undefined,
        },
        $push: {
          ngoActionHistory: createNgoActionLog(req, "accepted", "accepted"),
        },
      },
      { new: true, runValidators: true }
    )
  );

  if (!donation) {
    const current = await loadDonationOrThrow(req.params.id);
    const error = new Error(
      current.status === "pending"
        ? "Donation could not be accepted."
        : `Donation cannot be accepted because it is already ${current.status}.`
    );
    error.statusCode = 409;
    throw error;
  }

  logger.info("donations:accept_success", {
    requestId: req.requestId,
    donationId: donation._id,
    ngoId: req.user?._id,
  });
  res.json({ success: true, data: donation });
});

export const denyDonationRequest = asyncHandler(async (req, res) => {
  logger.debug("donations:deny_attempt", { requestId: req.requestId, donationId: req.params.id, ngoId: req.user?._id });

  const donation = await donationPopulate(
    Donation.findOneAndUpdate(
      { _id: req.params.id, status: "pending" },
      {
        $set: {
          status: "denied",
          deniedAt: new Date(),
          completionConfirmed: false,
        },
        $push: {
          ngoActionHistory: createNgoActionLog(req, "denied", "denied"),
        },
      },
      { new: true, runValidators: true }
    )
  );

  if (!donation) {
    const current = await loadDonationOrThrow(req.params.id);
    const error = new Error(
      current.status === "delivered"
        ? "Delivered donations cannot be denied."
        : `Donation cannot be denied because it is already ${current.status}.`
    );
    error.statusCode = 409;
    throw error;
  }

  logger.info("donations:deny_success", {
    requestId: req.requestId,
    donationId: donation._id,
    ngoId: req.user?._id,
  });
  res.json({ success: true, data: donation });
});

export const setDonationFulfillmentType = asyncHandler(async (req, res) => {
  const { fulfillmentType } = req.body;
  logger.debug("donations:fulfillment_attempt", {
    requestId: req.requestId,
    donationId: req.params.id,
    ngoId: req.user?._id,
    fulfillmentType,
  });

  if (!["pickup", "delivery"].includes(fulfillmentType)) {
    const error = new Error("fulfillmentType must be pickup or delivery.");
    error.statusCode = 400;
    throw error;
  }

  const donation = await donationPopulate(
    Donation.findOneAndUpdate(
      {
        _id: req.params.id,
        acceptedByNgo: req.user._id,
        status: { $in: ["accepted", "in_transit"] },
      },
      {
        $set: {
          fulfillmentType,
          status: "in_transit",
          "pickupWorkflow.status": "en_route",
        },
        $push: {
          ngoActionHistory: createNgoActionLog(req, "fulfillment_selected", "in_transit", { fulfillmentType }),
        },
      },
      { new: true, runValidators: true }
    )
  );

  if (!donation) {
    const current = await loadDonationOrThrow(req.params.id);
    const error = new Error(
      current.acceptedByNgo?.toString() !== req.user._id.toString()
        ? "Only the NGO that accepted this donation can choose the fulfillment type."
        : `Fulfillment type cannot be selected while donation is ${current.status}.`
    );
    error.statusCode = 409;
    throw error;
  }

  logger.info("donations:fulfillment_success", {
    requestId: req.requestId,
    donationId: donation._id,
    ngoId: req.user?._id,
    fulfillmentType: donation.fulfillmentType,
  });
  res.json({ success: true, data: donation });
});

export const completeDonationRequest = asyncHandler(async (req, res) => {
  const { completionNote, deliveryProofImage } = req.body;
  logger.debug("donations:complete_attempt", {
    requestId: req.requestId,
    donationId: req.params.id,
    ngoId: req.user?._id,
  });

  const current = await loadDonationOrThrow(req.params.id);

  if (current.acceptedByNgo?.toString() !== req.user._id.toString()) {
    const error = new Error("Only the NGO that accepted this donation can complete it.");
    error.statusCode = 403;
    throw error;
  }

  if (!["accepted", "in_transit"].includes(current.status)) {
    const error = new Error(`Donation cannot be completed while status is ${current.status}.`);
    error.statusCode = 409;
    throw error;
  }

  if (!current.fulfillmentType) {
    const error = new Error("Select pickup or delivery before marking this donation as completed.");
    error.statusCode = 400;
    throw error;
  }

  current.status = "delivered";
  current.deliveredAt = new Date();
  current.completionConfirmed = true;
  current.completionNote = completionNote || current.completionNote;
  current.deliveryProofImage = deliveryProofImage || current.deliveryProofImage;
  current.pickupConfirmedByNgo = current.fulfillmentType === "pickup";
  current.deliveryConfirmedByNgo = current.fulfillmentType === "delivery";
  current.pickupWorkflow = {
    ...(current.pickupWorkflow?.toObject ? current.pickupWorkflow.toObject() : current.pickupWorkflow || {}),
    status: "confirmed",
  };
  current.ngoActionHistory.push(
    createNgoActionLog(req, "completed", "delivered", {
      fulfillmentType: current.fulfillmentType,
      note: completionNote,
    })
  );
  await current.save();

  const donation = await donationPopulate(Donation.findById(current._id));

  logger.info("donations:complete_success", {
    requestId: req.requestId,
    donationId: donation._id,
    ngoId: req.user?._id,
    fulfillmentType: donation.fulfillmentType,
  });
  res.json({ success: true, data: donation });
});

export const rateDonation = asyncHandler(async (req, res) => {
  const { rating } = req.body;
  logger.debug("donations:rating_attempt", { requestId: req.requestId, donationId: req.params.id, rating });

  const donation = await Donation.findByIdAndUpdate(
    req.params.id,
    { rating },
    { new: true, runValidators: true }
  );

  if (!donation) {
    const error = new Error("Donation not found.");
    error.statusCode = 404;
    throw error;
  }

  logger.info("donations:rating_success", { requestId: req.requestId, donationId: donation._id, rating: donation.rating });
  res.json({ success: true, data: donation });
});
