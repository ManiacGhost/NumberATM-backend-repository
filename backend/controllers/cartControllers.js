const Cart = require("../models/Cart");
const VIPNumber = require("../models/vipNumber.js");

// Add VIP Number to Cart
exports.addToCart = async (req, res) => {
    try {
        const { vipNumberId } = req.body;

        // Check if VIP Number exists
        const vipNumber = await VIPNumber.findById(vipNumberId);
        if (!vipNumber) return res.status(404).json({ message: "VIP Number not found" });

        // Find cart for the user
        let cart = await Cart.findOne({ userId: req.user?.id });

        if (!cart) {
            cart = new Cart({ userId: req.user?.id, items: [] });
        }

        // Check if VIP Number is already in cart
        const alreadyExists = cart.items.some(item => item.vipNumberId.equals(vipNumberId));
        if (alreadyExists) {
            return res.status(403).json({ message: "VIP Number is already in cart" });
        }

        // Add new VIP Number to cart
        cart.items.push({ vipNumberId });

        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addToCartonLogin = async (req, res) => {
    try {
        const { userId, vipNumberIds } = req.body; // Expecting an array of IDs

        if (!Array.isArray(vipNumberIds) || vipNumberIds.length === 0) {
            return res.status(400).json({ message: "Invalid VIP Number IDs" });
        }

        // Find existing VIP Numbers
        const vipNumbers = await VIPNumber.find({ _id: { $in: vipNumberIds } });
        if (vipNumbers.length !== vipNumberIds.length) {
            return res.status(404).json({ message: "One or more VIP Numbers not found" });
        }

        // Find the user's cart
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            cart = new Cart({ userId, items: [] });
        }

        // Extract existing VIP Number IDs from the cart
        const existingVipIds = new Set(cart.items.map(item => item.vipNumberId.toString()));

        // Filter out VIP numbers that are already in the cart
        const newItems = vipNumberIds
            .filter(id => !existingVipIds.has(id))
            .map(id => ({ vipNumberId: id }));

        if (newItems.length === 0) {
            return res.status(403).json({ message: "All selected VIP Numbers are already in the cart" });
        }

        // Add only new VIP numbers to the cart
        cart.items.push(...newItems);
        await cart.save();

        res.status(200).json({ message: "VIP Numbers added successfully", cart });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Remove VIP Number from Cart
exports.removeFromCart = async (req, res) => {
    try {
        const { vipNumberId } = req.body;

        const cart = await Cart.findOne({ userId: req.user?.id });
        if (!cart) return res.status(404).json({ message: "Cart not found" });

        cart.items = cart.items.filter(item => !item.vipNumberId.equals(vipNumberId));

        await cart.save();
        res.status(200).json(cart);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getCart = async (req, res) => {
    try {
        if (!req.user?.id) {
            return res.status(400).json({ message: "User not authenticated" });
        }

        // Find cart and populate VIP Number details
        const cart = await Cart.findOne({ userId: req.user.id }).populate({
            path: "items.vipNumberId",
            populate: { path: "owner" } // Nested population
        });

        if (!cart || cart.items?.length === 0) {
            return res.status(200).json({ cart: { items: [] }, totalPrice: 0 });
        }

        // Filter out items where vipNumberId is null (number doesn't exist)
        const validItems = cart.items.filter(item => item.vipNumberId);

        // If invalid items were removed, update the cart in DB
        if (validItems.length !== cart.items.length) {
            cart.items = validItems;
            await cart.save(); // update DB
        }

        // Calculate total price considering discounts
        const totalPrice = validItems.reduce((total, item) => {
            const priceAfterDiscount = item.vipNumberId.price - (item.vipNumberId.discount || 0);
            return total + Math.max(priceAfterDiscount, 0);
        }, 0);

        res.status(200).json({ cart: { items: validItems }, totalPrice });
    } catch (error) {
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
