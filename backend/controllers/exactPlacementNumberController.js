// controllers/vipNumberController.js
const VIPNumber = require("../models/vipNumber");
const { sendEncryptedResponse } = require("../utils/encryptResponse");
const { applyPricing } = require("../utils/pricingHelper");
const Margin = require("../models/Margin");

const getExactPlacementNumber = async (req, res) => {
  try {
    // ---- 1. Query params -------------------------------------------------
    const {
      exactPlace,
      page = 1,
      limit = 10,
      sortbyprice = "low-high",
    } = req.query;

    // Fetch all margins once
    const margins = await Margin.find();

    // ---- 2. Validation --------------------------------------------------
    if (!exactPlace || typeof exactPlace !== "string") {
      return res.status(400).json({
        success: false,
        message: "exactPlace is required and must be a string",
      });
    }

    if (exactPlace.length !== 10) {
      return res.status(400).json({
        success: false,
        message: "exactPlace must be exactly 10 characters long",
      });
    }

    if (!/^[0-9*]{10}$/.test(exactPlace)) {
      return res.status(400).json({
        success: false,
        message: "exactPlace can only contain digits (0-9) and asterisks (*)",
      });
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10)));

    // ---- 3. Sort order --------------------------------------------------
    let sortOrder = 1;
    let sortLabel = "low-to-high";

    if (sortbyprice === "high-low") {
      sortOrder = -1;
      sortLabel = "high-to-low";
    } else if (sortbyprice !== "low-high") {
      return res.status(400).json({
        success: false,
        message: "sortbyprice must be 'low-high' or 'high-low'",
      });
    }

    // ---- 4. Build regex for exact match ----------------------------------
    const regexPattern =
      "^" +
      exactPlace
        .split("")
        .map((ch) => (ch === "*" ? "." : ch))
        .join("") +
      "$";
    const regex = new RegExp(regexPattern);

    // ---- 5. Try Exact Match First ----------------------------------------
    const exactPipeline = [
      { $match: { number: regex } },
      {
        $facet: {
          metadata: [{ $count: "total" }],
          data: [
            { $sort: { price: sortOrder } },
            { $skip: (pageNum - 1) * limitNum },
            { $limit: limitNum },
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
                matchType: { $literal: "exact" },
              },
            },
          ],
        },
      },
    ];

    let result = await VIPNumber.aggregate(exactPipeline);
    let total = result[0]?.metadata[0]?.total || 0;
    let data = result[0]?.data || [];

    // ---- 6. Fallback: Partial Match (if no exact match) -----------------
    if (data.length === 0) {
      console.log("No exact matches found. Trying partial match...");

      // Extract fixed positions (non-asterisk characters)
      const fixedPositions = [];
      for (let i = 0; i < exactPlace.length; i++) {
        if (exactPlace[i] !== "*") {
          fixedPositions.push({ index: i, digit: exactPlace[i] });
        }
      }

      // Only attempt partial match if there are at least 2 fixed positions
      if (fixedPositions.length >= 2) {
        // Build $and condition: at least 2 positions must match
        const partialConditions = fixedPositions.map((pos) => ({
          $eq: [{ $substr: ["$number", pos.index, 1] }, pos.digit],
        }));

        const fallbackPipeline = [
          {
            $addFields: {
              // Count how many positions match
              matchCount: {
                $size: {
                  $filter: {
                    input: partialConditions,
                    as: "condition",
                    cond: "$$condition",
                  },
                },
              },
            },
          },
          {
            // Require at least 2 matching positions
            $match: {
              matchCount: { $gte: Math.min(2, fixedPositions.length) },
            },
          },
          {
            $facet: {
              metadata: [{ $count: "total" }],
              data: [
                // Sort by match count (more matches first), then by price
                { $sort: { matchCount: -1, price: sortOrder } },
                { $skip: (pageNum - 1) * limitNum },
                { $limit: limitNum },
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
                    matchType: { $literal: "partial" },
                  },
                },
              ],
            },
          },
        ];

        result = await VIPNumber.aggregate(fallbackPipeline);
        total = result[0]?.metadata[0]?.total || 0;
        data = result[0]?.data || [];
      }
    }

    // === CRITICAL: Apply pricing logic to each number BEFORE sending ===
    const processedData = data.map((num) => applyPricing(num, margins));

    // ---- 7. Send Encrypted Response --------------------------------------
    return sendEncryptedResponse(processedData, total, res);
  } catch (error) {
    console.error("getExactPlacementNumber error:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

module.exports = { getExactPlacementNumber };
