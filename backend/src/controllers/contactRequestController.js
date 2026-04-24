import ContactRequest from "../models/ContactRequest.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

export const getContactRequests = asyncHandler(async (req, res) => {
  const { ngo, donor, status } = req.query;
  const filter = {};

  if (ngo) filter.ngo = ngo;
  if (donor) filter.donor = donor;
  if (status) filter.status = status;
  logger.debug("contact_requests:list", { requestId: req.requestId, filter });

  const requests = await ContactRequest.find(filter)
    .populate("ngo")
    .populate("donor", "role email profile")
    .populate("donation")
    .sort({ createdAt: -1 });

  logger.info("contact_requests:list_success", { requestId: req.requestId, count: requests.length });
  res.json({ success: true, count: requests.length, data: requests });
});

export const createContactRequest = asyncHandler(async (req, res) => {
  logger.debug("contact_requests:create_attempt", {
    requestId: req.requestId,
    ngo: req.body?.ngo,
    donor: req.body?.donor || req.user?._id,
    donation: req.body?.donation,
  });
  const request = await ContactRequest.create({
    ...req.body,
    donor: req.body.donor || req.user?._id,
  });

  logger.info("contact_requests:create_success", {
    requestId: req.requestId,
    contactRequestId: request._id,
    ngo: request.ngo,
    donor: request.donor,
    status: request.status,
  });
  res.status(201).json({ success: true, data: request });
});

export const updateContactRequestStatus = asyncHandler(async (req, res) => {
  logger.debug("contact_requests:status_attempt", {
    requestId: req.requestId,
    contactRequestId: req.params.id,
    status: req.body.status,
  });
  const request = await ContactRequest.findByIdAndUpdate(
    req.params.id,
    { status: req.body.status },
    { new: true, runValidators: true }
  );

  if (!request) {
    const error = new Error("Contact request not found.");
    error.statusCode = 404;
    throw error;
  }

  logger.info("contact_requests:status_success", {
    requestId: req.requestId,
    contactRequestId: request._id,
    status: request.status,
  });
  res.json({ success: true, data: request });
});
