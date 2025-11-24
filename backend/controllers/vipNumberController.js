// Get similar VIP numbers (by prefix or pattern)
exports.getSimilarVIPNumbers = async (req, res) => {
    try {
        const { number } = req.params;
        if (!number || number.length < 5) {
            return res.status(400).json({ message: "A valid number (at least 5 digits) is required." });
        }
        // Find numbers starting with the same first 5 digits
        const prefix = number.substring(0, 5);
        // You can expand this logic for more advanced similarity
        const similarNumbers = await VIPNumber.find({
            number: { $regex: `^${prefix}` },
            stock: { $ne: 0 },
        }).limit(30).populate({ path: 'owner', match: { showCased: true } });

        // Optionally, add more similarity logic (e.g., contains, endsWith, etc.)

        // Filter out numbers with no owner or the same as the current number
        const filtered = similarNumbers.filter(num => num.owner && num.number !== number);
        res.status(200).json({ data: filtered });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
const VIPNumber = require("../models/vipNumber");
const multer = require("multer");
const xlsx = require("xlsx");
const Owner = require("../models/Owner"); // Import Owner model
const { default: mongoose } = require("mongoose");
const { getMobileNumberCategory } = require("./categorizer");
const highlightMobileNumber = require("./highlighter");
const Margin = require("../models/Margin");

exports.getAllVIPNumbers = async (req, res) => {
    try {
        const { page = 1, limit = 10 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);

        const skip = (pageNum - 1) * limitNum;

        const pipeline = [
            {
                $match: {
                    stock: { $ne: 0 }
                }
            },
            {
                $lookup: {
                    from: 'owners', // collection name in MongoDB (usually lowercase plural)
                    localField: 'owner',
                    foreignField: '_id',
                    as: 'owner'
                }
            },
            { $unwind: '$owner' },
            {
                $match: {
                    'owner.showCased': true
                }
            },
            {
                $facet: {
                    data: [
                        { $skip: skip },
                        { $limit: limitNum }
                    ],
                    totalCount: [
                        { $count: 'count' }
                    ]
                }
            }
        ];

        const result = await VIPNumber.aggregate(pipeline);
        const data = result[0].data;
        const total = result[0].totalCount[0]?.count || 0;

        res.status(200).json({
            data,
            total
        });
    } catch (err) {
        console.error('Error in getAllVIPNumbers:', err);
        res.status(500).json({ error: err.message });
    }
};


exports.getVIPNumbersbyAdmin = async (req, res) => {
    try {
        const { page = 1, limit = 10, number, category, featured, vendor } = req.query;

        const query = {};

        if (number) query.number = { $regex: number, $options: 'i' };
        if (category) query.category = category;
        if (featured) query.featured = featured === 'true';

        // Initial query without vendor filter
        const allNumbers = await VIPNumber.find(query)
            .populate({
                path: 'owner',
                match: { showCased: true },
                select: 'name showCased',
            });

        // Filter to keep only numbers with no owner or showCased owner
        let filtered = allNumbers.filter(
            (num) => !num.owner || num.owner.showCased
        );

        // Apply vendor filter based on owner.name
        if (vendor) {
            filtered = filtered.filter(
                (num) => num.owner?.name?.toLowerCase() === vendor.toLowerCase()
            );
        }

        const totalCount = filtered.length;

        // Apply pagination after all filtering
        const paginated = filtered.slice((page - 1) * limit, page * limit);

        res.status(200).json({
            data: paginated,
            totalPages: Math.ceil(totalCount / limit),
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Get a single VIP number
exports.getVIPNumber = async (req, res) => {
    try {
        const number = await VIPNumber.findOne({ number: req.params.id })
            .populate({ path: 'owner' });

        if (!number || !number.owner) {
            return res.status(404).json({ message: "Number not found or owner not showcasing", owner: number?.owner });
        }

        res.status(200).json({ data: number });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
// Get a single VIP number
exports.getVIPNumberByAdmin = async (req, res) => {
    try {
        const number = await VIPNumber.findOne({ number: req.params.id })
            .populate({ path: 'owner' });
        if (!number || !number.owner) {
            return res.status(404).json({ message: "Number not found or owner not found" });
        }
        res.status(200).json({ data: number });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Search VIP numbers
exports.searchVIPNumbers = async (req, res) => {
    try {
        const searchTerm = req.query.search;

        if (!searchTerm) {
            return res.status(400).json({ message: "Search term is required" });
        }

        const numbers = await VIPNumber.find({
            number: { $regex: searchTerm, $options: "i" },
            stock: { $ne: 0 }
        }).populate({ path: 'owner', match: { showCased: true } });

        const filteredNumbers = numbers.filter(num => num.owner);
        res.status(200).json({ data: filteredNumbers });
    } catch (error) {
        //console.error("Error fetching numbers:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// Get all featured VIP numbers
exports.getAllFeaturedVIPNumbers = async (req, res) => {
    try {
        const numbers = await VIPNumber.find({
            featured: { $ne: false },
            stock: { $gt: 0 }
        }).populate({ path: 'owner', match: { showCased: true } });

        const filteredNumbers = numbers.filter(num => num.owner);
        res.status(200).json({ data: filteredNumbers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getPopularVIPNumbers = async (req, res) => {
    try {
        const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 12, 1), 50);

        const pipeline = [
            {
                $match: {
                    stock: { $gt: 0 },
                    ordered: { $ne: true },
                    featured: true
                }
            },
            {
                $lookup: {
                    from: "owners",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            { $unwind: "$owner" },
            {
                $match: {
                    "owner.showCased": true
                }
            },
            { $sort: { updatedAt: -1 } },
            { $limit: limit }
        ];

        const numbers = await VIPNumber.aggregate(pipeline);
        res.status(200).json({ data: numbers });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSoldNumbers = async (req, res) => {
    try {
        const { owner, saleDate, search, sort = "-saleTime", page = 1, limit = 10 } = req.query;
        let filter = { stock: 0 }; // Fetch only sold numbers

        // Filter by Sale Date
        if (saleDate) {
            const [start, end] = saleDate.split(",");
            filter.saleTime = {
                $gte: new Date(start),
                $lte: new Date(end || new Date()),
            };
        }

        // Search by Number
        if (search) {
            filter.number = { $regex: search, $options: "i" };
        }

        // Pagination
        const skip = (page - 1) * limit;
        const total = await VIPNumber.countDocuments(filter);

        let soldNumbersQuery = VIPNumber.find(filter)
            .populate("owner", "name") // Populate only the name field
            .sort(sort)
            .skip(skip)
            .limit(Number(limit));

        let soldNumbers = await soldNumbersQuery;

        // Filter by Owner Name after population (since MongoDB doesn't allow direct filtering on populated fields)
        if (owner) {
            soldNumbers = soldNumbers.filter(num => num.owner?.name?.toLowerCase().includes(owner.toLowerCase()));
        }

        res.json({
            total: owner ? soldNumbers.length : total, // Adjust count if filtering by owner
            page: Number(page),
            totalPages: Math.ceil((owner ? soldNumbers.length : total) / limit),
            soldNumbers,
        });
    } catch (error) {
        //console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};
exports.deleteNumbers = async (req, res) => {
    try {
        let { numbers } = req.body;

        if (!numbers || !Array.isArray(numbers) || numbers.length === 0) {
            return res.status(400).json({ message: "No valid numbers provided." });
        }

        // Delete matching numbers from the database
        const result = await VIPNumber.deleteMany({ number: { $in: numbers } });

        res.json({ message: `${result.deletedCount} numbers deleted successfully.` });
    } catch (error) {
        //console.error(error);
        res.status(500).json({ message: "Server Error" });
    }
};


exports.addVIPNumber = async (req, res) => {
    try {
        let { number, price, owner } = req.body;

        // Validate number format
        if (!number || !/^[6789]\d{9}$/.test(number)) {
            return res.status(400).json({ error: "Invalid phone number format" });
        }

        // Validate price
        if (!price || price <= 0) {
            return res.status(400).json({ error: "Price must be greater than 0" });
        }

        // Check if number already exists
        const existing = await VIPNumber.findOne({ number });
        if (existing) {
            return res.status(409).json({ error: "VIP number already exists" }); // 409 Conflict
        }

        // Process Owner
        if (!mongoose.Types.ObjectId.isValid(owner)) {
            let existingOwner = await Owner.findOne({ name: owner });

            if (!existingOwner) {
                const newOwner = new Owner({ name: owner });
                await newOwner.save();
                owner = newOwner._id;
            } else {
                owner = existingOwner._id;
            }
        }

        // Generate Category
        const category = getMobileNumberCategory(String(number));

        // Create and save VIP Number
        const vipNumber = new VIPNumber({
            number,
            price,
            category,
            owner,
            sum: calculateSums(number).sum,
            total: calculateSums(number).total,
            sum2: calculateSums(number).sum2,
            highLightedNumber: highlightMobileNumber(number)
        });

        await vipNumber.save();
        res.status(201).json({ message: "VIP number added successfully", vipNumber });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


exports.uploadVIPNumbers = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        // Read Excel file from buffer
        const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
        const sheetName = workbook.SheetNames[0];
        const data = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);

        let ownerId = req.body.owner;

        // Resolve ownerId: either ObjectId or name
        if (!mongoose.Types.ObjectId.isValid(ownerId)) {
            let existingOwner = await Owner.findOne({ name: ownerId });

            if (!existingOwner) {
                const newOwner = new Owner({ name: ownerId });
                await newOwner.save();
                ownerId = newOwner?._id;
            } else {
                ownerId = existingOwner?._id;
            }
        }

        // Prepare and format numbers
        const numbersToInsert = data.map((row) => {
            let number = row.Number ? String(row.Number).trim() : String(row.number).trim();

            // Validate that the number has exactly 10 digits and starts with 6, 7, 8, or 9
            if (!/^[6789]\d{9}$/.test(number)) {
                throw new Error(`Invalid number format for ${number}. Must be 10 digits and start with 6, 7, 8, or 9.`);
            }


            return {
                number,
                price: row.Price || row.price,
                view: row.Title || row.title || row.view || row.View,
                category: row.category || getMobileNumberCategory(number),
                owner: ownerId,
                sum: calculateSums(number).sum,
                total: calculateSums(number).total,
                sum2: calculateSums(number).sum2,
                highLightedNumber: highlightMobileNumber(number)
            };
        });

        // Extract number strings
        const numberStrings = numbersToInsert.map(n => n.number);

        // Fetch existing numbers
        const existingNumbers = await VIPNumber.find({ number: { $in: numberStrings } }).distinct("number");

        // Filter out duplicates
        const nonExistingNumbers = numbersToInsert.filter(n => !existingNumbers.includes(n.number));

        // Insert only non-existing ones
        if (nonExistingNumbers.length > 0) {
            await VIPNumber.insertMany(nonExistingNumbers, { ordered: false });
        }

        return res.status(200).json({
            message: "VIP numbers uploaded & categorized successfully",
            inserted: nonExistingNumbers.length,
            skipped: existingNumbers.length
        });
    } catch (error) {
        return res.status(500).json({ message: "Error processing file", error: error.message });
    }
};

exports.uploadVIPNumbersWithVendor = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const rows = xlsx.utils.sheet_to_json(sheet);

        const uniqueNumbers = new Set();
        const vendorNames = new Set();
        const cleanRows = [];

        // First pass: validate and extract unique numbers/vendors
        for (const row of rows) {
            const rawNumber = String(row.Number || row.number || "").trim();
            const rawVendor = String(row.Vendor || row.vendor || "").trim();

            if (!/^[6789]\d{9}$/.test(rawNumber)) continue;
            if (uniqueNumbers.has(rawNumber)) continue;

            uniqueNumbers.add(rawNumber);
            vendorNames.add(rawVendor);
            cleanRows.push({ number: rawNumber, vendorName: rawVendor, raw: row });
        }

        // Resolve all vendor names
        const vendorNameToId = {};
        const existingVendors = await Owner.find({ name: { $in: Array.from(vendorNames) } });
        existingVendors.forEach(v => vendorNameToId[v.name] = v._id);

        const missingVendors = Array.from(vendorNames).filter(name => !vendorNameToId[name]);
        if (missingVendors.length > 0) {
            const newVendors = await Owner.insertMany(missingVendors.map(name => ({ name })));
            newVendors.forEach(v => vendorNameToId[v.name] = v._id);
        }

        // Second pass: build full payload
        const numbersToInsert = cleanRows.map(({ number, vendorName, raw }) => {
            const ownerId = vendorNameToId[vendorName];
            const price = raw.Price || raw.price;
            const view = raw.Title || raw.title || raw.view || raw.View;
            const category = raw.category || getMobileNumberCategory(number);
            const { sum, total, sum2 } = calculateSums(number);
            const highLightedNumber = highlightMobileNumber(number);

            return {
                number,
                price,
                view,
                category,
                owner: ownerId,
                sum,
                total,
                sum2,
                highLightedNumber
            };
        });

        // Check for existing numbers in DB
        const existingNumbers = await VIPNumber.find({
            number: { $in: Array.from(uniqueNumbers) }
        }).distinct("number");

        const nonExistingNumbers = numbersToInsert.filter(n => !existingNumbers.includes(n.number));

        // Insert new records
        let inserted = 0;
        if (nonExistingNumbers.length > 0) {
            try {
                await VIPNumber.insertMany(nonExistingNumbers, { ordered: false });
                inserted = nonExistingNumbers.length;
            } catch (err) {
                // Handle partial inserts due to duplicate errors
                if (err.writeErrors) {
                    inserted = nonExistingNumbers.length - err.writeErrors.length;
                }
            }
        }

        return res.status(200).json({
            message: "VIP numbers uploaded successfully",
            inserted,
            skipped: existingNumbers.length + (numbersToInsert.length - nonExistingNumbers.length)
        });

    } catch (error) {
        return res.status(500).json({
            message: "Error processing file",
            error: error.message
        });
    }
};




exports.addNumbersAsText = async (req, res) => {
    try {
        const { numbers } = req.body;

        if (!numbers || numbers.length === 0) {
            return res.status(400).json({ message: "No numbers provided" });
        }

        // Validate numbers with Owner & Price
        const validNumbers = numbers.filter(n =>
            /^[6789]\d{9}$/.test(n.number) && n.number.length === 10 && n.price > 0 && n.owner?.trim()
        );

        if (validNumbers.length === 0) {
            return res.status(400).json({ message: "No valid numbers found" });
        }

        // Process Owner IDs
        const ownerCache = {}; // To avoid duplicate DB queries
        for (const number of validNumbers) {
            let ownerId = number.owner;

            if (!mongoose.Types.ObjectId.isValid(ownerId)) {
                // It's a name, check cache or DB
                if (ownerCache[ownerId]) {
                    ownerId = ownerCache[ownerId]; // Use cached ID
                } else {
                    let existingOwner = await Owner.findOne({ name: ownerId });

                    if (!existingOwner) {
                        const newOwner = new Owner({ name: ownerId });
                        await newOwner.save();
                        ownerId = newOwner._id; // Store new owner's ID
                    } else {
                        ownerId = existingOwner._id; // Use existing owner's ID
                    }

                    ownerCache[number.owner] = ownerId; // Cache for next loop
                }
            }

            number.owner = ownerId; // Set the ObjectId for owner

            // Generate Category
            number.category = getMobileNumberCategory(String(number.number));
            // console.log("Chl rha hai!")
            // Add sum, total, and highlightedNumber
            const sumResult = calculateSums(number?.number); // Assuming this returns { sum, total }
            // console.log("Chl rha hai!2")
            number.sum = sumResult.sum;
            number.total = sumResult.total;
            number.sum2 = sumResult.sum2;
            number.highLightedNumber = highlightMobileNumber(number?.number); // assuming it returns a string
        }

        const numbersToCheck = validNumbers.map(num => num.number);

        const existingNumbers = await VIPNumber.find({ number: { $in: numbersToCheck } }).distinct("number");

        const nonExistingNumbers = validNumbers.filter(num => !existingNumbers.includes(num.number));

        const savedNumbers = await VIPNumber.insertMany(nonExistingNumbers, { ordered: false }).catch(err => {
            return [];
        });

        res.json({
            message: `Successfully added ${savedNumbers.length} numbers`,
            savedNumbers,
            skipped: numbers.length - savedNumbers.length,
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message: "Server error", error });
    }
};



// Update an existing VIP number
exports.updateVIPNumber = async (req, res) => {
    try {
        const { id } = req.params;
        const { number } = req.body;

        // Check for duplicate number
        const existingVIP = await VIPNumber.findOne({ number: id });

        await VIPNumber.findOneAndUpdate({ number: id }, req.body, { new: true });
        res.status(200).json({ message: "VIP number updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.markFeatured = async (req, res) => {
    try {
        const { id } = req.params;
        await VIPNumber.findByIdAndUpdate(id, { $set: { featured: true } }, { new: true });
        res.status(200).json({ message: "VIP number updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
exports.markAllFeatured = async (req, res) => {
    try {
        const { ids } = req.body;
        if (!ids || ids.length === 0) {
            return res.status(400).json({ success: false, message: "No numbers provided" });
        }

        await VIPNumber.updateMany({ _id: { $in: ids } }, { featured: true });

        res.status(200).json({ success: true, message: "Selected numbers marked as featured" });
    } catch (error) {
        res.status(500).json({ success: false, message: "Error marking numbers as featured" });
    }
};
exports.removeFeatured = async (req, res) => {
    try {
        const { id } = req.params;
        await VIPNumber.findByIdAndUpdate(id, { $set: { featured: false } }, { new: true });
        res.status(200).json({ message: "VIP number updated successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};


// Delete a VIP number
exports.deleteVIPNumber = async (req, res) => {
    try {
        const { id } = req.params;
        await VIPNumber.findByIdAndDelete(id);
        res.status(200).json({ message: "VIP number deleted successfully" });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getSearchedVIPNumbers = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            minPrice,
            maxPrice,
            searchInput,
            startWith,
            endsWith,
            contains,
            startWithDigits,
            endsWithDigits,
            mustContain,
            mustNotContain,
            category,
            anySum,
            anyWhere,
            sortType,
            sum,
            total
        } = req.body;

        const pageNum = Math.max(parseInt(page), 1);
        const limitNum = Math.max(parseInt(limit), 1);
        const skip = (pageNum - 1) * limitNum;

        const query = {
            deleted: { $ne: true },
            stock: { $ne: 0 }
        };

        const regexFilters = [];

        const makeRegex = (val) => new RegExp(val, "i");

        if (searchInput?.trim()) regexFilters.push({ number: makeRegex(searchInput) });
        if (startWith) regexFilters.push({ number: { $regex: `^${searchInput}`, $options: "i" } });
        if (endsWith) regexFilters.push({ number: { $regex: `${searchInput}$`, $options: "i" } });
        if (contains) regexFilters.push({ number: makeRegex(searchInput) });
        if (startWithDigits) regexFilters.push({ number: { $regex: `^${startWithDigits}`, $options: "i" } });
        if (endsWithDigits) regexFilters.push({ number: { $regex: `${endsWithDigits}$`, $options: "i" } });
        if (anyWhere?.trim()) regexFilters.push({ number: makeRegex(anyWhere) });

        if (mustContain?.trim()) {
            const mustArr = mustContain.split(",").map((val) => val.trim()).filter(Boolean);
            mustArr.forEach(part => {
                regexFilters.push({ number: { $regex: part, $options: "i" } });
            });
        }

        if (mustNotContain?.trim()) {
            const notArr = mustNotContain.split(",").map((val) => val.trim()).filter(Boolean);
            if (notArr.length > 0) {
                query.number = {
                    ...query.number,
                    $not: new RegExp(notArr.join('|'), 'i')
                };
            }
        }

        if (sum || total || anySum) {
            if (sum) regexFilters.push({ sum: Number(sum) });
            if (total) regexFilters.push({ total: Number(total) });
            if (anySum) {
                regexFilters.push({
                    $or: [
                        { sum: Number(anySum) },
                        { total: Number(anySum) },
                        { sum2: Number(anySum) }
                    ]
                });
            }
        }

        if (regexFilters.length > 0) {
            query.$and = regexFilters;
        }

        if (category) {
            query.category = { $in: [category] };
        }

        let allNumbers = [];
        let filtered = [];
        let count = 0;

        // Case 1️⃣: NO FILTERS → your existing random skip logic
        const hasNoFilters = !minPrice && !maxPrice &&
            !searchInput && !startWithDigits && !endsWithDigits &&
            !mustContain && !mustNotContain && !category && !anyWhere &&
            !sum && !total && !anySum && !sortType;

        if (hasNoFilters) {
            const totalAvailable = await VIPNumber.countDocuments({ deleted: { $ne: true }, stock: { $ne: 0 } });

            const maxSkip = Math.max(totalAvailable - limitNum, 0);
            const randomSkip = Math.floor(Math.random() * (maxSkip + 1));

            allNumbers = await VIPNumber.find({ deleted: { $ne: true }, stock: { $ne: 0 } })
                .skip(randomSkip)
                .limit(limitNum)
                .populate({
                    path: "owner",
                    match: { showCased: true }
                });

            filtered = allNumbers.filter(num => num.owner);
            count = totalAvailable;

            return res.json({
                success: true,
                data: filtered,
                total: count
            });
        }

        // Case 2️⃣: PRICE FILTER → your margin + price logic
        if ((maxPrice !== null && maxPrice > 0 && maxPrice !== Infinity) || minPrice > 0) {
            const margins = await Margin.find();

            allNumbers = await VIPNumber.find(query)
                .skip(0) // fetch all first
                .limit(5000) // safe upper limit (you can adjust)
                .populate({
                    path: "owner",
                    match: { showCased: true }
                });

            filtered = allNumbers.filter(num => num.owner);
            count = await VIPNumber.countDocuments(query);

            let pricedNumbers = filtered.map(item => {
                const originalPrice = item?.price;
                const ownerDiscount = item?.owner?.discount || 0;
                const discountedPrice = originalPrice - (originalPrice * ownerDiscount * 0.01);

                const marginData = margins?.find(
                    (margin) => originalPrice >= margin.minPrice && originalPrice <= margin.maxPrice
                );
                const marginPercent = marginData ? marginData.marginPercent : 0;
                const marginAmount = (originalPrice * marginPercent) / 100;

                const finalPrice = discountedPrice + marginAmount;
                const roundedFinalPrice = Math.round(finalPrice / 10) * 10;

                return {
                    ...item._doc,
                    roundedFinalPrice
                };
            });

            let finalFiltered = pricedNumbers.filter(item => {
                if (minPrice && item.roundedFinalPrice < minPrice) return false;
                if (maxPrice && item.roundedFinalPrice > maxPrice) return false;
                return true;
            });

            if (sortType === 'lowToHigh') {
                finalFiltered = finalFiltered.sort((a, b) => a.roundedFinalPrice - b.roundedFinalPrice);
            } else if (sortType === 'highToLow') {
                finalFiltered = finalFiltered.sort((a, b) => b.roundedFinalPrice - a.roundedFinalPrice);
            }

            const paginated = finalFiltered.slice(skip, skip + limitNum);

            return res.json({
                success: true,
                data: paginated,
                total: count
            });
        }

        // Case 3️⃣: FILTERS APPLIED, no sortType → use RANDOM $sample
        if (!sortType) {
            const pipeline = [
                { $match: query },
                {
                    $lookup: {
                        from: "owners",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner"
                    }
                },
                { $unwind: "$owner" },
                { $match: { "owner.showCased": true } },
                { $sample: { size: limitNum } } // TRUE RANDOM
            ];

            filtered = await VIPNumber.aggregate(pipeline);
            count = await VIPNumber.countDocuments(query);

            return res.json({
                success: true,
                data: filtered,
                total: count
            });
        }

        // Case 4️⃣: FILTERS APPLIED + sortType → normal sort
        let sortQuery = {};
        if (sortType === 'lowToHigh') {
            sortQuery.price = 1;
        } else if (sortType === 'highToLow') {
            sortQuery.price = -1;
        } else {
            sortQuery.createdAt = -1; // fallback sort
        }

        const pipeline = [
            { $match: query },
            {
                $lookup: {
                    from: "owners",
                    localField: "owner",
                    foreignField: "_id",
                    as: "owner"
                }
            },
            { $unwind: "$owner" },
            { $match: { "owner.showCased": true } },
            { $sort: sortQuery },
            { $skip: skip },
            { $limit: limitNum }
        ];

        filtered = await VIPNumber.aggregate(pipeline);
        count = await VIPNumber.countDocuments(query);

        // Final response
        return res.json({
            success: true,
            data: filtered,
            total: count
        });

    } catch (error) {
        console.error("Error in getSearchedVIPNumbers:", error);
        return res.status(500).json({ success: false, message: "Server Error", error });
    }
};

// Quick dropdown search for numbers containing given digits
exports.getDropdownVIPNumbers = async (req, res) => {
    try {
        const q = (req.query.q || req.query.query || '').toString().trim();
        if (!q) return res.status(200).json({ data: [] });

        // Keep only digits to avoid accidental regex problems
        const digits = q.replace(/\D/g, '');
        if (!digits) return res.status(200).json({ data: [] });

        const regex = new RegExp(digits);

        const numbers = await VIPNumber.find({
            number: { $regex: regex },
            stock: { $ne: 0 }
        })
            .limit(20)
            .select('number price highLightedNumber owner')
            .populate({ path: 'owner', match: { showCased: true }, select: 'name' });

        const filtered = numbers.filter(n => n.owner);

        res.status(200).json({ data: filtered });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};






// Helper function to calculate sums (adjust as per your logic)
const calculateSums = (number) => {
    if (!number) return;
    // const sanitizedNumber = number.replace(/\s+/g, "");
    // console.log(number)
    const sumOfDigits = number?.split("").reduce((acc, digit) => acc + parseInt(digit, 10), 0);
    const sumOfResultingDigits = sumOfDigits.toString().split("").reduce((acc, digit) => acc + parseInt(digit, 10), 0);
    const finalSum = sumOfResultingDigits.toString().split("").reduce((acc, digit) => acc + parseInt(digit, 10), 0);

    return { total: sumOfDigits, sum2: sumOfResultingDigits, sum: finalSum };
};
// const allNumbers = async () => {
//     console.log("started")
//     const numbers = await VIPNumber.find({ number: '9936679936' }); // Make sure to await this
//     for (const number of numbers) {
//         const highlightedNumber = highlightMobileNumber(number.number);
//         const spacedNumber = addSpaceAfter5DigitsInHtml(highlightedNumber);
//         await VIPNumber.findByIdAndUpdate(
//             number._id,
//             { $set: { highLightedNumber: spacedNumber } },
//             { new: true }
//         );
//     }
//     console.log("ended")
// };
const allNumbersSetSum2 = async () => {
    console.log("started")
    const numbers = await VIPNumber.find(); // Make sure to await this
    for (const number of numbers) {
        if (!number?.sum2) {
            await VIPNumber.findByIdAndUpdate(
                number._id,
                { $set: { sum2: calculateSums(number.number).sum2 } },
                { new: true }
            );
        }
    }
    console.log("ended")
};
// allNumbers();
