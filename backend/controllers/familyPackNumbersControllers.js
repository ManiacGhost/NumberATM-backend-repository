const VIPNumber = require("../models/vipNumber");
const { encryptValue } = require("../utils/encryptFamilyPackResponse");
const Margin = require("../models/Margin");
const { applyPricing } = require("../utils/pricingHelper");


const getFamilyPackNumbers = async (req, res) => {
  try {
    const { familyPack, page = 1, limit = 10, sortbyprice = "low-high" } = req.query;

   

    const packSize = parseInt(familyPack);
    if (!packSize || packSize < 2 || packSize > 7) {
      return res.status(400).json({ success: false, message: "familyPack must be 2-7" });
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const sortDirection = ["low-high", "high-low"].includes(sortbyprice) ? sortbyprice : "low-high";
    const priceSortDirection = sortDirection === "high-low" ? -1 : 1;

    // Fetch margins once
    const margins = await Margin.find().lean();

    // === BASE PIPELINE: DETERMINISTIC ORDER ===
    const basePipeline = [
      { $match: { ordered: false, stock: { $gt: 0 } } },
      {
        $lookup: { from: "owners", localField: "owner", foreignField: "_id", as: "owner" }
      },
      { $unwind: "$owner" },
      { $match: { "owner.showCased": true } },
      {
        $addFields: {
          numberLength: { $strLenCP: "$number" },
          first4: { $substr: ["$number", 0, 4] },
          last4: { $substr: ["$number", { $subtract: [{ $strLenCP: "$number" }, 4] }, 4] },
          first5: { $substr: ["$number", 0, 5] },
          first6: { $substr: ["$number", 0, 6] },
          first7: { $substr: ["$number", 0, 7] },
          first8: { $substr: ["$number", 0, 8] },
          first9: { $substr: ["$number", 0, 9] },
          last5: { $substr: ["$number", { $subtract: [{ $strLenCP: "$number" }, 5] }, 5] },
          last6: { $substr: ["$number", { $subtract: [{ $strLenCP: "$number" }, 6] }, 6] },
          last7: { $substr: ["$number", { $subtract: [{ $strLenCP: "$number" }, 7] }, 7] },
          last8: { $substr: ["$number", { $subtract: [{ $strLenCP: "$number" }, 8] }, 8] },
          last9: { $substr: ["$number", { $subtract: [{ $strLenCP: "$number" }, 9] }, 9] },
        },
      },
      { $match: { numberLength: 10 } },
      { $sort: { _id: 1 } }
    ];

    const patterns = [
      { name: "prefix5suffix4", priority: 0, groupBy: { $concat: ["$first5", "-", "$last4"] } },
      { name: "prefix4suffix5", priority: 1, groupBy: { $concat: ["$first4", "-", "$last5"] } },
      { name: "prefix4suffix4", priority: 2, groupBy: { $concat: ["$first4", "-", "$last4"] } },
      { name: "first9", priority: 3, groupBy: "$first9" },
      { name: "last9", priority: 4, groupBy: "$last9" },
      { name: "first8", priority: 5, groupBy: "$first8" },
      { name: "last8", priority: 6, groupBy: "$last8" },
      { name: "first7", priority: 7, groupBy: "$first7" },
      { name: "last7", priority: 8, groupBy: "$last7" },
      { name: "first6", priority: 9, groupBy: "$first6" },
      { name: "last6", priority: 10, groupBy: "$last6" },
    ];

    const mapNumber = (n) => ({
      _id: n._id,
      number: n.number,
      price: n.price,
      view: n.view,
      category: n.category,
      stock: n.stock,
      sum: n.sum,
      total: n.total,
      sum2: n.sum2,
      highLightedNumber: n.highLightedNumber,
      discount: n.discount,
      margin: n.margin,
      featured: n.featured,
      ordered: n.ordered,
      owner: n.owner,
      createdAt: n.createdAt,
      updatedAt: n.updatedAt,
      __v: n.__v,
    });

    // === AGGREGATE - SEQUENTIAL FOR DETERMINISM ===
    const allPacks = [];
    
    for (const p of patterns) {
      const pipeline = [
        ...basePipeline,
        { $group: { _id: p.groupBy, docs: { $push: "$$ROOT" } } },
        { $match: { $expr: { $gte: [{ $size: "$docs" }, packSize] } } },
        { $sort: { "_id": 1 } },
        {
          $addFields: {
            docs: { $sortArray: { input: "$docs", sortBy: { price: 1, _id: 1 } } }
          }
        },
        { $project: { _id: 0, pattern: "$_id", docs: { $slice: ["$docs", packSize] } } },
      ];
      
      const groups = await VIPNumber.aggregate(pipeline);
      
      groups.forEach(g => {
        const numbers = g.docs.map(mapNumber);
        const totalPrice = numbers.reduce((s, n) => s + Number(n.price), 0);
        allPacks.push({
          pattern: p.name,
          patternPriority: p.priority,
          matchPattern: g.pattern,
          numbers,
          totalPrice,
          count: packSize,
          packId: numbers.map(n => n._id.toString()).sort().join("|")
        });
      });
    }

    // === REMOVE DUPLICATES ===
    const seen = new Map();
    const uniquePacks = [];
    
    for (const pack of allPacks) {
      if (!seen.has(pack.packId)) {
        seen.set(pack.packId, true);
        uniquePacks.push(pack);
      }
    }

    // === GLOBAL SORT - PRICE FIRST! ===
    uniquePacks.sort((a, b) => {
      // 1. PRICE SORTING (GLOBAL)
      const priceDiff = (a.totalPrice - b.totalPrice) * priceSortDirection;
      if (Math.abs(priceDiff) > 0.001) {
        return priceDiff;
      }

      // 2. Pattern priority (tie-breaker)
      if (a.patternPriority !== b.patternPriority) {
        return a.patternPriority - b.patternPriority;
      }

      // 3. Match pattern
      const patternCmp = a.matchPattern.localeCompare(b.matchPattern);
      if (patternCmp !== 0) return patternCmp;

      // 4. Pack ID (deterministic)
      return a.packId.localeCompare(b.packId);
    });

   
 
       // === PAGINATION ===
    const total = uniquePacks.length;
    let data = uniquePacks.slice(skip, skip + limitNum).map(pack => ({
      pattern: pack.pattern,
      matchPattern: pack.matchPattern,
      numbers: pack.numbers,        // ← array of raw numbers
      totalPrice: pack.totalPrice,
      count: pack.count
    }));

    // === APPLY PRICING TO EVERY NUMBER IN EVERY PACK ===
    data = data.map(pack => ({
      ...pack,
      numbers: pack.numbers.map(num => applyPricing(num, margins)), // ← Fixed here
      // Recalculate totalPrice after discount + margin
      totalPrice: pack.numbers
        .map(num => applyPricing(num, margins))
        .reduce((sum, n) => sum + n.price, 0)
    }));

    const response = {
      success: true,
      requestedPackSize: packSize,
      page: pageNum,
      limit: limitNum,
      sortbyprice: sortDirection,
      total,
      totalPages: Math.ceil(total / limitNum),
      data,
    };

    // Encrypt only the final response (or specific fields if encryptValue expects object)
    return res.json(encryptValue(response));

  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

module.exports = { getFamilyPackNumbers };