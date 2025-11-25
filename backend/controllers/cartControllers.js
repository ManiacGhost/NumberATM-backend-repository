const Cart = require("../models/Cart");
const VIPNumber = require("../models/vipNumber");
const Margin = require("../models/Margin");

exports.addToCart = async (req, res) => {
    try {
        const { vipNumberId } = req.body;

        if (!req.user?.id) {
            return res.status(400).json({ message: "User not authenticated" });
        }

        // Check if VIP Number exists
        const vipNumber = await VIPNumber.findById(vipNumberId).populate("owner");
        if (!vipNumber) return res.status(404).json({ message: "VIP Number not found" });

        // Find or create user cart
        let cart = await Cart.findOne({ userId: req.user.id }).populate({
            path: "items.vipNumberId",
            populate: { path: "owner" }
        });

        if (!cart) cart = new Cart({ userId: req.user.id, items: [] });

        // Prevent duplicates
        const alreadyExists = cart.items.some(item => item.vipNumberId.equals(vipNumberId));
        if (alreadyExists) {
            return res.status(403).json({ message: "VIP Number is already in cart" });
        }

        // Add item
        cart.items.push({ vipNumberId });
        await cart.save();

        // Repopulate for accurate pricing
        await cart.populate({
            path: "items.vipNumberId",
            populate: { path: "owner" }
        });

        // Fetch margins
        const allMargins = await Margin.find();

        // Calculate total price with margin logic
        let totalPrice = 0;
        const validItems = cart.items.filter(i => i.vipNumberId);

        for (const item of validItems) {
            const vip = item.vipNumberId;
            const basePrice = vip.price || 0;
            const discount = vip.discount || 0;
            const priceAfterDiscount = Math.max(basePrice - discount, 0);

            // Find the applicable margin range
            const marginData = allMargins.find(
                (m) => basePrice >= m.minPrice && basePrice <= m.maxPrice
            );

            const marginPercent = marginData ? marginData.marginPercent : 0;
            const finalPrice = priceAfterDiscount + (basePrice * marginPercent / 100);
            const originalPrice = basePrice + (basePrice * marginPercent / 100);
            const roundedFinalPrice = Math.round(finalPrice/10)*10;
            const roundedOriginalPrice = Math.round(originalPrice/10)*10;
            totalPrice += roundedFinalPrice;
        }

        // Remove sensitive owner fields before sending
        const sanitizedItems = validItems.map(i => {
            const itemObj = i.toObject();
            if (itemObj.vipNumberId?.owner) delete itemObj.vipNumberId.owner;
            return itemObj;
        });

        res.status(200).json({
            message: "Added to cart successfully",
            cart: { items: sanitizedItems },
            totalPrice
        });

    } catch (error) {
        console.error("Error in addToCart:", error);
        res.status(500).json({ error: error.message });
    }
};

exports.addToCartonLogin = async (req, res) => {
    try {
        const { userId, vipNumberIds } = req.body;

        if (!userId || !Array.isArray(vipNumberIds) || vipNumberIds.length === 0) {
            return res.status(400).json({ message: "Invalid input data" });
        }

        // Find valid numbers
        const vipNumbers = await VIPNumber.find({ _id: { $in: vipNumberIds } }).populate("owner");
        if (vipNumbers.length === 0) return res.status(404).json({ message: "No valid VIP Numbers found" });

        // Find or create cart
        let cart = await Cart.findOne({ userId }).populate({
            path: "items.vipNumberId",
            populate: { path: "owner" }
        });
        if (!cart) cart = new Cart({ userId, items: [] });

        // Filter out already present IDs
        const existingIds = new Set(cart.items.map(i => i.vipNumberId.toString()));
        const newItems = vipNumbers.filter(v => !existingIds.has(v._id.toString()));

        if (newItems.length === 0) {
            return res.status(403).json({ message: "All numbers already in cart" });
        }

        // Add new ones
        cart.items.push(...newItems.map(v => ({ vipNumberId: v._id })));
        await cart.save();

        // Repopulate for pricing
        await cart.populate({
            path: "items.vipNumberId",
            populate: { path: "owner" }
        });

        const allMargins = await Margin.find();

        // Calculate total price
        let totalPrice = 0;
        const validItems = cart.items.filter(i => i.vipNumberId);

        for (const item of validItems) {
            const vip = item.vipNumberId;
            const basePrice = vip.price || 0;
            const discount = vip.discount || 0;
            const priceAfterDiscount = Math.max(basePrice - discount, 0);

            // Find the applicable margin range
            const marginData = allMargins.find(
                (m) => basePrice >= m.minPrice && basePrice <= m.maxPrice
            );

            const marginPercent = marginData ? marginData.marginPercent : 0;
            const finalPrice = priceAfterDiscount + (basePrice * marginPercent / 100);
            const originalPrice = basePrice + (basePrice * marginPercent / 100);
            const roundedFinalPrice = Math.round(finalPrice/10)*10;
            const roundedOriginalPrice = Math.round(originalPrice/10)*10;
            totalPrice += roundedFinalPrice;
        }

        // Remove sensitive info
        const sanitizedItems = validItems.map(i => {
            const itemObj = i.toObject();
            if (itemObj.vipNumberId?.owner) delete itemObj.vipNumberId.owner;
            return itemObj;
        });

        res.status(200).json({
            message: "VIP Numbers added successfully",
            cart: { items: sanitizedItems },
            totalPrice
        });

    } catch (error) {
        console.error("Error in addToCartonLogin:", error);
        res.status(500).json({ error: error.message });
    }
};



exports.removeFromCart = async (req, res) => {
    try {
        const { vipNumberId } = req.body;

        if (!req.user?.id) {
            return res.status(400).json({ message: "User not authenticated" });
        }

        const cart = await Cart.findOne({ userId: req.user.id }).populate({
            path: "items.vipNumberId",
            populate: { path: "owner" } // nested populate if needed
        });

        if (!cart) {
            return res.status(404).json({ message: "Cart not found" });
        }

        // Remove the specified item
        cart.items = cart.items.filter(item => item.vipNumberId && !item.vipNumberId._id.equals(vipNumberId));
        await cart.save();

        // Filter out any null vipNumberId (deleted numbers)
        const validItems = cart.items.filter(item => item.vipNumberId);

        // Fetch all margin data
        const allMargins = await Margin.find();

        let totalPrice = 0;

        // Recalculate total price based on updated cart
        for (const item of validItems) {
            const vip = item.vipNumberId;
            const basePrice = vip.price || 0;
            const discount = vip.discount || 0;
            const priceAfterDiscount = Math.max(basePrice - discount, 0);

            // Find the applicable margin range
            const marginData = allMargins.find(
                (m) => basePrice >= m.minPrice && basePrice <= m.maxPrice
            );

            const marginPercent = marginData ? marginData.marginPercent : 0;
            const finalPrice = priceAfterDiscount + (basePrice * marginPercent / 100);
            const originalPrice = basePrice + (basePrice * marginPercent / 100);
            const roundedFinalPrice = Math.round(finalPrice/10)*10;
            const roundedOriginalPrice = Math.round(originalPrice/10)*10;
            totalPrice += roundedFinalPrice;
        }

        res.status(200).json({
            cart: { items: validItems },
            totalPrice
        });
    } catch (error) {
        console.error("Error in removeFromCart:", error);
        res.status(500).json({ error: error.message });
    }
};


exports.getCart = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(400).json({ message: "User not authenticated" });
        }

        // Find user's cart and populate VIP number + owner
        const cart = await Cart.findOne({ userId: req.user.id }).populate({
            path: "items.vipNumberId",
            populate: { path: "owner" } // Nested population
        });

        if (!cart || cart.items?.length === 0) {
            return res.status(200).json({ cart: { items: [] }, totalPrice: 0 });
        }

        // Filter out invalid/deleted items
        const validItems = cart.items.filter(item => item.vipNumberId);

        // If any invalid items were removed, update DB
        if (validItems.length !== cart.items.length) {
            cart.items = validItems;
            await cart.save();
        }

        // Fetch all margin data once
        const allMargins = await Margin.find();

        let totalPrice = 0;
        const processedItems = [];

        // Process and calculate values for each cart item
        for (const item of validItems) {
            const vip = item.vipNumberId;
            const basePrice = vip.price || 0;
            const discountPercent = vip.owner?.discount || 0;

            // Apply discount
            const discountedPrice = basePrice - (basePrice * discountPercent * 0.01);

            // Find margin range
            const marginData = allMargins.find(
                (m) => basePrice >= m.minPrice && basePrice <= m.maxPrice
            );

            const marginPercent = marginData ? marginData.marginPercent : 0;
            const finalPrice = discountedPrice + (basePrice * marginPercent / 100);
            const priceWithMargin = basePrice + (basePrice * marginPercent / 100);

            // Rounded values
            const roundedFinalPrice = Math.round(finalPrice / 10) * 10;
            const roundedOriginalPrice = Math.round(priceWithMargin / 10) * 10;
            const displayedDiscount = ((priceWithMargin - finalPrice) / priceWithMargin) * 100;

            totalPrice += roundedFinalPrice;

            // Prepare sanitized item (no owner info)
            const itemObj = item.toObject();
            if (itemObj.vipNumberId?.owner) delete itemObj.vipNumberId.owner;

            // Add calculated fields
            itemObj.vipNumberId.price = roundedFinalPrice;
            itemObj.vipNumberId.originalPrice = roundedOriginalPrice;
            itemObj.vipNumberId.displayedDiscount = displayedDiscount;

            processedItems.push(itemObj);
        }

        res.status(200).json({
            cart: { items: processedItems },
            totalPrice
        });
    } catch (error) {
        console.error("Error fetching cart:", error);
        res.status(500).json({ error: error.message });
    }
};



// Clear Cart
exports.clearCart = async (req, res) => {
    try {
        await Cart.findOneAndDelete({ userId: req.user?.id });
        res.status(200).json({ message: "Cart cleared" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
