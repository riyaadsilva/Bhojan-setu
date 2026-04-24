import NGO from "../models/NGO.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

const parseNumber = (value) => {
  if (value === undefined || value === "") return undefined;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const getNGOs = asyncHandler(async (req, res) => {
  const { search, city, area, verified, category, sort = "nearest" } = req.query;
  const lat = parseNumber(req.query.lat);
  const lng = parseNumber(req.query.lng);
  const radiusKm = parseNumber(req.query.radiusKm);
  const quantityKg = parseNumber(req.query.quantityKg);
  const filter = {};
  const andFilters = [];

  if (city) filter.city = new RegExp(city, "i");
  if (area) filter.area = new RegExp(area, "i");
  if (verified !== undefined) filter.verified = verified === "true";
  if (category) filter.acceptedCategories = category;
  if (quantityKg !== undefined) {
    andFilters.push({ $or: [{ maxPickupQuantityKg: { $gte: quantityKg } }, { maxPickupQuantityKg: { $exists: false } }] });
  }
  if (search) {
    andFilters.push({
      $or: [
        { name: new RegExp(search, "i") },
        { area: new RegExp(search, "i") },
        { city: new RegExp(search, "i") },
        { cause: new RegExp(search, "i") },
      ],
    });
  }
  if (andFilters.length) filter.$and = andFilters;
  logger.debug("ngos:list", { requestId: req.requestId, filter, lat, lng, radiusKm, quantityKg, sort });

  let ngos;
  if (lat !== undefined && lng !== undefined) {
    const pipeline = [
      {
        $geoNear: {
          near: { type: "Point", coordinates: [lng, lat] },
          distanceField: "distanceMeters",
          spherical: true,
          query: filter,
          ...(radiusKm ? { maxDistance: radiusKm * 1000 } : {}),
        },
      },
      {
        $addFields: {
          distanceKm: { $round: [{ $divide: ["$distanceMeters", 1000] }, 1] },
        },
      },
      { $sort: sort === "rating" ? { rating: -1, distanceKm: 1 } : { distanceMeters: 1 } },
    ];

    ngos = await NGO.aggregate(pipeline);
  } else {
    ngos = await NGO.find(filter).sort(sort === "rating" ? { rating: -1, distanceKm: 1 } : { distanceKm: 1, rating: -1 });
  }

  logger.info("ngos:list_success", { requestId: req.requestId, count: ngos.length, proximity: lat !== undefined && lng !== undefined });
  res.json({ success: true, count: ngos.length, data: ngos });
});

export const createNGO = asyncHandler(async (req, res) => {
  logger.debug("ngos:create_attempt", { requestId: req.requestId, name: req.body?.name, city: req.body?.city });
  const ngo = await NGO.create(req.body);
  logger.info("ngos:create_success", { requestId: req.requestId, ngoId: ngo._id, name: ngo.name });
  res.status(201).json({ success: true, data: ngo });
});

export const getNGOById = asyncHandler(async (req, res) => {
  logger.debug("ngos:detail", { requestId: req.requestId, ngoId: req.params.id });
  const ngo = await NGO.findById(req.params.id);

  if (!ngo) {
    const error = new Error("NGO not found.");
    error.statusCode = 404;
    throw error;
  }

  res.json({ success: true, data: ngo });
});

export const updateNGO = asyncHandler(async (req, res) => {
  logger.debug("ngos:update_attempt", { requestId: req.requestId, ngoId: req.params.id });
  const ngo = await NGO.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!ngo) {
    const error = new Error("NGO not found.");
    error.statusCode = 404;
    throw error;
  }

  logger.info("ngos:update_success", { requestId: req.requestId, ngoId: ngo._id, name: ngo.name });
  res.json({ success: true, data: ngo });
});
