// controllers/relatedNumbersController.js
const VIPNumber = require("../models/vipNumber");
const { sendEncryptedResponse } = require("../utils/encryptResponse");
const Margin = require("../models/Margin");
const { applyPricing } = require("../utils/pricingHelper");

// Helper: Send error response
const sendError = (res, status, message) => {
  return res.status(status).json({
    success: false,
    statusCode: status,
    message,
  });
};

exports.getRelatedNumbers = async (req, res) => {
  try {
    const { number, page = 1, limit = 10, sortbyprice } = req.query;

    // Fetch all margins once
    const margins = await Margin.find();

    // === 1. Validate `number` ===
    if (!number) {
      return sendError(res, 400, "Query parameter 'number' is required");
    }
    if (!/^\d{10}$/.test(number)) {
      return sendError(res, 400, "Invalid number: Must be exactly 10 digits");
    }

    // === 2. Validate `page` and `limit` ===
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);

    if (isNaN(pageNum) || pageNum < 1) {
      return sendError(res, 400, "Invalid 'page': Must be a positive integer");
    }
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      return sendError(res, 400, "Invalid 'limit': Must be between 1 and 100");
    }

    // === 3. Validate `sortbyprice` ===
    if (sortbyprice && !["low-high", "high-low"].includes(sortbyprice)) {
      return sendError(
        res,
        400,
        "Invalid 'sortbyprice': Use 'low-high' or 'high-low'"
      );
    }

    const skip = (pageNum - 1) * limitNum;

    // === 4. Generate consecutive chunks (4 to 10 digits) ===
    const chunks = [];
    for (let len = 4; len <= 10; len++) {
      for (let i = 0; i <= 10 - len; i++) {
        chunks.push(number.slice(i, i + len));
      }
    }

    if (chunks.length === 0) {
      return sendError(res, 500, "Failed to generate number chunks");
    }

    const orConditions = chunks.map((chunk) => ({
      number: { $regex: chunk },
    }));

    // === 5. Sort Stage ===
    let sortStage = { matchedLength: -1 };
    if (sortbyprice === "low-high") {
      sortStage = { matchedLength: -1, price: 1 };
    } else if (sortbyprice === "high-low") {
      sortStage = { matchedLength: -1, price: -1 };
    }

    // === 6. Main Aggregation Pipeline ===
    const pipeline = [
      {
        $match: { $and: [{ number: { $ne: number } }, { $or: orConditions }] },
      },
      {
        $addFields: {
          matchedLength: {
            $max: chunks.map((chunk) => ({
              $cond: [
                { $regexMatch: { input: "$number", regex: chunk } },
                { $strLenCP: chunk },
                0,
              ],
            })),
          },
        },
      },
      { $match: { matchedLength: { $gte: 4 } } },
      { $sort: sortStage },
      { $unset: "matchedLength" },
      {
        $lookup: {
          from: "owners",
          localField: "owner",
          foreignField: "_id",
          as: "owner",
        },
      },
      { $unwind: { path: "$owner", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          _id: 1,
          number: 1,
          category: 1,
          price: 1,
          originalPrice: 1,
          displayedDiscount: 1,
          featured: 1,
          stock: 1,
          createdAt: 1,
          sum: 1,
          total: 1,
          sum2: 1,
          highLightedNumber: 1,
          view: 1,
        },
      },
      { $skip: skip },
      { $limit: limitNum },
    ];

    // === 7. Count Pipeline ===
    const countPipeline = [
      {
        $match: { $and: [{ number: { $ne: number } }, { $or: orConditions }] },
      },
      {
        $addFields: {
          matchedLength: {
            $max: chunks.map((chunk) => ({
              $cond: [
                { $regexMatch: { input: "$number", regex: chunk } },
                { $strLenCP: chunk },
                0,
              ],
            })),
          },
        },
      },
      { $match: { matchedLength: { $gte: 4 } } },
      { $count: "total" },
    ];

    // === 8. Execute ===
    const [data, countResult] = await Promise.all([
      VIPNumber.aggregate(pipeline),
      VIPNumber.aggregate(countPipeline),
    ]);

    const total = countResult[0]?.total || 0;

    // === CRITICAL: Apply pricing logic to each number BEFORE sending ===
    const processedData = data.map((num) => applyPricing(num, margins));

    // === 8. Send encrypted response with processed data ===
    sendEncryptedResponse(processedData, total, res);

    // === 10. Manually override response to add statusCode + message ===
    // Since sendEncryptedResponse uses res.json(), we intercept and modify
    const originalJson = res.json;
    res.json = function (obj) {
      obj.statusCode = 200;
      obj.message = "Related numbers fetched successfully";
      return originalJson.call(this, obj);
    };

    return; // Prevent double response
  } catch (err) {
    console.error("getRelatedNumbers Error:", err);

    if (err.message.includes("Aggregation") || err.message.includes("Count")) {
      return sendError(res, 500, "Database query failed. Please try again.");
    }

    return sendError(res, 500, "Internal server error");
  }
};
