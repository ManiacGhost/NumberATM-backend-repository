const Razorpay = require('razorpay');
const crypto = require('crypto');
const dotenv = require('dotenv');
const User = require('../models/User');
const Cart = require('../models/Cart');
const Order = require('../models/Order');
const OrderCounter = require('../models/OrderCounter');
const VIPNumber = require('../models/vipNumber');
const Promo = require('../models/Promo');
const {sendOrderEmail, sendOrderEmailCustomer} = require('./emailSender');
dotenv.config();
// Validate Razorpay environment keys before creating the client
const { RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;
if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error('Missing RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET in environment. Add them to .env or your host env.');
}

// Create an Invoice and handle payment
const razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
});
// Controller to create a new order
exports.createOrder = async (req, res) => {
    const { amount, cartIds } = req.body;
    const user = await User.findById(req.user.id);

    // Find all VIP numbers that match the cartIds
    const vipNumbers = await VIPNumber.find({ _id: { $in: cartIds } });

    // Filter out the numbers that are out of stock
    const outOfStockNumbers = vipNumbers.filter((number) => number.stock === 0);

    if (outOfStockNumbers.length > 0) {
        return res.status(400).json({
            message: "Some numbers are sold just now. Get another one, sorry for the inconvenience!",
            outOfStockNumbers: outOfStockNumbers.map((num) => num.number), // Assuming 'number' is the field storing the actual number
        });
    }
    try {
        const options = {
            amount: parseInt(amount * 100), // Amount in paise
            currency: 'INR',
        };

        const order = await razorpay.orders.create(options);

        res.json({
            id: order.id,
            currency: order.currency,
            amount: order.amount,
        });
    } catch (error) {
        console.log(error)
        res.status(500).json({ error: error.message });
    }
};
exports.verifyPayment = async (req, res) => {
    const { paymentId, orderId:rzpOrderId, signature, formData, price, amount, gst, promoCode, isApplied, discount } = req.body;
    const userId = req.user.id;
    console.log(req.body);
    // Generate signature for verification
    const shasum = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET);
    shasum.update(`${rzpOrderId}|${paymentId}`);
    const generatedSignature = shasum.digest("hex");

    if (generatedSignature === signature) {
        try {
            // Fetch the user's cart
            const cart = await Cart.findOne({ userId });

            if (!cart || cart.items.length === 0) {
                return res.status(400).json({ success: false, message: "Cart is empty" });
            }
            let orderCounter = await OrderCounter.findOne();
            if (!orderCounter) {
                orderCounter = new OrderCounter(); // Initialize if not found
            }
            orderCounter.count += 1;
            await orderCounter.save();

            // Generate unique orderId
            const genOrderId = `NA-${(Date.now() % 1000000).toString()}${Math.floor(100 + Math.random() * 900)}`;
            // Transform cart items into order format
            const orderItems = cart.items.map(item => ({
                vipNumber: item.vipNumberId, // Renaming vipNumberId to vipNumber
            }));
            const vipNumbers = orderItems.map(item => item.vipNumber);

            // Update all matching vipNumbers and set stock to 0
            let promo = null;
            if (isApplied) {
                promo = await Promo.findOne({ code: promoCode });
            }
            console.log(rzpOrderId)
            // Create new order using transformed items
            const newOrder = new Order({
                rzpOrderId,
                orderId: genOrderId,
                ...formData,
                promoCode: promo ? promo._id : null,
                rzpPaymentId: paymentId,
                price: Number(price),
                discount: Number(discount),
                totalPrice: Number(amount),
                gst: Number(gst),
                customer: userId,
                items: orderItems, // Correct format for Order schema
                paymentStatus: "Paid",
            });

            await newOrder.save(); // Save order in the database
            await VIPNumber.updateMany(
                { _id: { $in: vipNumbers } },
                { $set: { stock: 0, saleTime: new Date() } } // Corrected field name & Date object
            );
            await sendOrderEmail(newOrder?.orderId);
            await sendOrderEmailCustomer(newOrder?.orderId);
            // Clear user's cart after order creation
            await Cart.findOneAndDelete({ userId });

            res.status(201).json({ success: true, message: "Payment verified and Order created!", order: newOrder });
        } catch (error) {
            console.error("Error creating order:", error);
            res.status(500).json({ success: false, message: "Error creating order" });
        }
    } else {
        res.status(400).json({ success: false, message: "Signature mismatch" });
    }
};