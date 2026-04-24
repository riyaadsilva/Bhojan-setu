import Donation from "../models/Donation.js";
import FoodLog from "../models/FoodLog.js";
import NGO from "../models/NGO.js";
import User from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { logger } from "../utils/logger.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
const endOfDay = (date) => new Date(startOfDay(date).getTime() + MS_PER_DAY);
const startOfWeek = (date) => {
  const value = startOfDay(date);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  value.setDate(value.getDate() + diff);
  return value;
};
const endOfWeek = (date) => new Date(startOfWeek(date).getTime() + 7 * MS_PER_DAY);
const startOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 1);

const round = (value) => Math.round((value + Number.EPSILON) * 10) / 10;

const getRangeForPeriod = (period, now = new Date()) => {
  if (period === "daily") {
    return { start: startOfDay(now), end: endOfDay(now), trendStart: new Date(startOfDay(now).getTime() - 6 * MS_PER_DAY), trendUnit: "day", trendCount: 7 };
  }
  if (period === "weekly") {
    return { start: startOfWeek(now), end: endOfWeek(now), trendStart: new Date(startOfWeek(now).getTime() - 7 * 7 * MS_PER_DAY), trendUnit: "week", trendCount: 8 };
  }
  return { start: startOfMonth(now), end: endOfMonth(now), trendStart: new Date(now.getFullYear(), now.getMonth() - 5, 1), trendUnit: "month", trendCount: 6 };
};

const donationOwnershipFilter = (user) => {
  const profile = user?.profile || {};
  const donorName = profile.name || profile.businessName || profile.ngoName;
  const donorPhone = profile.phone;

  return {
    donorType: user?.role === "restaurant" ? "restaurant" : user?.role === "individual" ? "individual" : "__none__",
    $or: [
      { donor: user?._id },
      ...(donorName ? [{ donorName }] : []),
      ...(donorPhone ? [{ donorPhone }] : []),
    ],
  };
};

const foodLogProjectionStage = {
  $project: {
    metricDate: { $ifNull: ["$logDate", "$createdAt"] },
    prepared: { $ifNull: ["$preparedQuantity", "$food_prepared"] },
    consumed: { $ifNull: ["$consumedQuantity", "$food_consumed"] },
    leftover: "$food_leftover",
    donated: { $ifNull: ["$donatedQuantity", 0] },
    wasted: {
      $ifNull: [
        "$wastedQuantity",
        {
          $max: [
            {
              $subtract: [
                { $ifNull: ["$preparedQuantity", "$food_prepared"] },
                { $ifNull: ["$consumedQuantity", "$food_consumed"] },
                { $ifNull: ["$donatedQuantity", 0] },
              ],
            },
            0,
          ],
        },
      ],
    },
    foodCategory: { $ifNull: ["$foodCategory", "normal"] },
  },
};

const donationNumericStage = {
  $addFields: {
    numericRemaining: {
      $let: {
        vars: {
          match: {
            $regexFind: {
              input: { $ifNull: ["$remaining", "0"] },
              regex: "\\d+(?:\\.\\d+)?",
            },
          },
        },
        in: {
          $cond: [
            { $ifNull: ["$$match.match", false] },
            { $toDouble: "$$match.match" },
            0,
          ],
        },
      },
    },
    metricDate: { $ifNull: ["$createdAt", new Date()] },
  },
};

const buildAlerts = ({ wastePercentage, donationEfficiency }) => {
  const alerts = [];

  if (wastePercentage > 20) {
    alerts.push("High food wastage detected today. Consider reducing preparation quantity.");
  }
  if (donationEfficiency > 70) {
    alerts.push("Good rescue efficiency. Most leftover food was redirected successfully.");
  }

  return alerts;
};

const aggregateWasteSummary = async ({ user, period }) => {
  const userId = user._id;
  const role = user.role;
  const { start, end, trendStart, trendUnit } = getRangeForPeriod(period);
  const match = {
    $and: [
      { $or: [{ user: userId }, { donorId: userId }] },
      { $or: [{ donorType: role }, { donorType: { $exists: false } }, { donorType: null }] },
      { $or: [{ logDate: { $gte: start, $lt: end } }, { logDate: { $exists: false }, createdAt: { $gte: start, $lt: end } }] },
    ],
  };

  const [summaryResult, trendResult, categoryResult, potentialWasteResult] = await Promise.all([
    FoodLog.aggregate([
      { $match: match },
      foodLogProjectionStage,
      {
        $group: {
          _id: null,
          totalPrepared: { $sum: "$prepared" },
          totalConsumed: { $sum: "$consumed" },
          totalLeftover: { $sum: "$leftover" },
          totalDonated: { $sum: "$donated" },
          totalWasted: { $sum: "$wasted" },
        },
      },
    ]),
    FoodLog.aggregate([
      {
        $match: {
          $and: [
            { $or: [{ user: userId }, { donorId: userId }] },
            { $or: [{ donorType: role }, { donorType: { $exists: false } }, { donorType: null }] },
            { $or: [{ logDate: { $gte: trendStart, $lt: end } }, { logDate: { $exists: false }, createdAt: { $gte: trendStart, $lt: end } }] },
          ],
        },
      },
      foodLogProjectionStage,
      {
        $group: {
          _id:
            trendUnit === "day"
              ? { $dateToString: { format: "%Y-%m-%d", date: "$metricDate" } }
              : trendUnit === "week"
                ? { $dateToString: { format: "%G-W%V", date: "$metricDate" } }
                : { $dateToString: { format: "%Y-%m", date: "$metricDate" } },
          prepared: { $sum: "$prepared" },
          donated: { $sum: "$donated" },
          wasted: { $sum: "$wasted" },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    FoodLog.aggregate([
      { $match: match },
      foodLogProjectionStage,
      {
        $group: {
          _id: "$foodCategory",
          prepared: { $sum: "$prepared" },
          donated: { $sum: "$donated" },
          wasted: { $sum: "$wasted" },
        },
      },
      { $sort: { wasted: -1, _id: 1 } },
    ]),
    Donation.aggregate([
      { $match: donationOwnershipFilter(user) },
      donationNumericStage,
      {
        $group: {
          _id: null,
          potentialWaste: {
            $sum: {
              $cond: [{ $ne: ["$status", "delivered"] }, "$numericRemaining", 0],
            },
          },
        },
      },
    ]),
  ]);

  const summary = summaryResult[0] || {
    totalPrepared: 0,
    totalConsumed: 0,
    totalLeftover: 0,
    totalDonated: 0,
    totalWasted: 0,
  };
  const wastePercentage = summary.totalPrepared > 0 ? round((summary.totalWasted / summary.totalPrepared) * 100) : 0;
  const donationEfficiency = summary.totalLeftover > 0 ? round((summary.totalDonated / summary.totalLeftover) * 100) : 0;

  return {
    period,
    range: { start, end },
    summary: {
      totalPrepared: round(summary.totalPrepared || 0),
      totalConsumed: round(summary.totalConsumed || 0),
      totalLeftover: round(summary.totalLeftover || 0),
      totalDonated: round(summary.totalDonated || 0),
      totalWasted: round(summary.totalWasted || 0),
      potentialWaste: round(potentialWasteResult[0]?.potentialWaste || 0),
      wastePercentage,
      donationEfficiency,
    },
    trends: trendResult.map((item) => ({
      label: item._id,
      prepared: round(item.prepared || 0),
      donated: round(item.donated || 0),
      wasted: round(item.wasted || 0),
    })),
    donatedVsWasted: [
      { name: "Donated", value: round(summary.totalDonated || 0) },
      { name: "Wasted", value: round(summary.totalWasted || 0) },
    ],
    categoryWaste: categoryResult.map((item) => ({
      category: item._id || "uncategorized",
      prepared: round(item.prepared || 0),
      donated: round(item.donated || 0),
      wasted: round(item.wasted || 0),
    })),
    alerts: buildAlerts({ wastePercentage, donationEfficiency }),
  };
};

const aggregateIndividualWaste = async (user) => {
  const now = new Date();
  const filter = donationOwnershipFilter(user);

  const [summaryResult, trendResult, categoryResult] = await Promise.all([
    Donation.aggregate([
      { $match: filter },
      donationNumericStage,
      {
        $group: {
          _id: null,
          totalDonationsMade: { $sum: 1 },
          totalQuantityDonated: { $sum: "$numericRemaining" },
          completedQuantity: {
            $sum: {
              $cond: [{ $eq: ["$status", "delivered"] }, "$numericRemaining", 0],
            },
          },
          potentialWaste: {
            $sum: {
              $cond: [{ $ne: ["$status", "delivered"] }, "$numericRemaining", 0],
            },
          },
          pendingOrIncompleteCount: {
            $sum: {
              $cond: [{ $ne: ["$status", "delivered"] }, 1, 0],
            },
          },
        },
      },
    ]),
    Donation.aggregate([
      { $match: filter },
      donationNumericStage,
      {
        $match: {
          metricDate: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1), $lt: endOfMonth(now) },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m", date: "$metricDate" } },
          donated: { $sum: "$numericRemaining" },
          potentialWaste: {
            $sum: {
              $cond: [{ $ne: ["$status", "delivered"] }, "$numericRemaining", 0],
            },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]),
    Donation.aggregate([
      { $match: filter },
      donationNumericStage,
      {
        $group: {
          _id: "$category",
          donated: { $sum: "$numericRemaining" },
          potentialWaste: {
            $sum: {
              $cond: [{ $ne: ["$status", "delivered"] }, "$numericRemaining", 0],
            },
          },
        },
      },
      { $sort: { potentialWaste: -1, _id: 1 } },
    ]),
  ]);

  const summary = summaryResult[0] || {
    totalDonationsMade: 0,
    totalQuantityDonated: 0,
    completedQuantity: 0,
    potentialWaste: 0,
    pendingOrIncompleteCount: 0,
  };
  const wastePercentage = summary.totalQuantityDonated > 0 ? round((summary.potentialWaste / summary.totalQuantityDonated) * 100) : 0;
  const donationEfficiency = summary.totalQuantityDonated > 0 ? round((summary.completedQuantity / summary.totalQuantityDonated) * 100) : 0;

  return {
    period: "individual",
    summary: {
      ...summary,
      totalPrepared: 0,
      totalDonated: round(summary.totalQuantityDonated || 0),
      totalWasted: round(summary.potentialWaste || 0),
      wastePercentage,
      donationEfficiency,
    },
    trends: trendResult.map((item) => ({
      label: item._id,
      donated: round(item.donated || 0),
      wasted: round(item.potentialWaste || 0),
    })),
    donatedVsWasted: [
      { name: "Completed", value: round(summary.completedQuantity || 0) },
      { name: "Potential Waste", value: round(summary.potentialWaste || 0) },
    ],
    categoryWaste: categoryResult.map((item) => ({
      category: item._id || "uncategorized",
      donated: round(item.donated || 0),
      wasted: round(item.potentialWaste || 0),
    })),
    alerts: buildAlerts({ wastePercentage, donationEfficiency }),
  };
};

export const getOverview = asyncHandler(async (req, res) => {
  logger.debug("analytics:overview_start", { requestId: req.requestId });
  const [
    usersByRole,
    donationsByStatus,
    donationsByCategory,
    totalFoodLeftover,
    totalFoodPrepared,
    mealsDistributed,
    ngoCount,
  ] = await Promise.all([
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    Donation.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Donation.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }]),
    FoodLog.aggregate([{ $group: { _id: null, value: { $sum: "$food_leftover" } } }]),
    FoodLog.aggregate([{ $group: { _id: null, value: { $sum: "$food_prepared" } } }]),
    Donation.countDocuments({ status: { $in: ["accepted", "picked_up", "completed"] } }),
    NGO.countDocuments({ verified: true }),
  ]);

  logger.info("analytics:overview_success", {
    requestId: req.requestId,
    usersByRole: usersByRole.length,
    donationsByStatus: donationsByStatus.length,
    ngoCount,
  });
  res.json({
    success: true,
    data: {
      usersByRole,
      donationsByStatus,
      donationsByCategory,
      totalFoodLeftover: totalFoodLeftover[0]?.value || 0,
      totalFoodPrepared: totalFoodPrepared[0]?.value || 0,
      mealsDistributed,
      ngoCount,
    },
  });
});

export const getWasteDaily = asyncHandler(async (req, res) => {
  logger.debug("analytics:waste_daily_start", { requestId: req.requestId, userId: req.user?._id });
  const data = await aggregateWasteSummary({ user: req.user, period: "daily" });
  res.json({ success: true, data });
});

export const getWasteWeekly = asyncHandler(async (req, res) => {
  logger.debug("analytics:waste_weekly_start", { requestId: req.requestId, userId: req.user?._id });
  const data = await aggregateWasteSummary({ user: req.user, period: "weekly" });
  res.json({ success: true, data });
});

export const getWasteMonthly = asyncHandler(async (req, res) => {
  logger.debug("analytics:waste_monthly_start", { requestId: req.requestId, userId: req.user?._id });
  const data = await aggregateWasteSummary({ user: req.user, period: "monthly" });
  res.json({ success: true, data });
});

export const getIndividualWaste = asyncHandler(async (req, res) => {
  logger.debug("analytics:waste_individual_start", { requestId: req.requestId, userId: req.user?._id });
  const data = await aggregateIndividualWaste(req.user);
  res.json({ success: true, data });
});
