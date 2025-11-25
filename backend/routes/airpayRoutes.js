var express = require('express');
var router = express.Router();
const dotenv = require('dotenv');
dotenv.config();

const { body, check, validationResult } = require("express-validator");
const { validateTxn, runValidation } = require('../validate/validateTransaction');
const VIPNumber = require('../models/vipNumber');
const OrderCounter = require('../models/OrderCounter');
const Promo = require('../models/Promo');
const Order = require('../models/Order');
const Cart = require('../models/Cart');
const { authMiddleware } = require('../middlewares/authMiddleware');
const { sendOrderEmail, sendOrderEmailCustomer } = require('../controllers/emailSender');
const dayjs = require('dayjs');
const Margin = require('../models/Margin');
/*var mid = '19010';
var username = '1021705';
var password = '74b1K5k2';
var secret = 'P43WoR9jcQkB7UOh';*/
// Merchant Id 335854 Username CKFzeZGut2 Password WRx4M373 API key V8GqK8T6RC4ajHM8
var mid = '335854';
var username = process.env.AIRPAY_USERNAME || 'CKFzeZGut2';
var password = process.env.AIRPAY_PASSWORD || 'WRx4M373';
var secret = process.env.AIRPAY_SECRET_KEY || 'V8GqK8T6RC4ajHM8';

var now = new Date();



/* GET home page. */
router.get('/', function (req, res, next) {
    res.render('index', { title: 'Express' });
});

router.get('/txn', function (req, res, next) {
    res.render('txn', { title: 'Express' });
});

router.post(
    "/sendtoairpay", authMiddleware,
    (req, res, next) => {
        // console.log(req.body);
        next();
    },
    [
        // First name
        check("buyerFirstName", "First Name is required")
            .not()
            .isEmpty()
            .isLength({ min: 3 })
            .withMessage("The name must have a minimum length of 3")
            .isLength({ max: 50 })
            .withMessage("The name must have a maximum length of 50")
            .custom((value) => {
                var nameValidate = /^[A-Za-z]+$/;
                if (!nameValidate.test(value)) {
                    throw new Error("Invalid first name");
                }
                return true;
            })
            .trim(),

        // Last name
        check("buyerLastName", "Last Name is required")
            .not()
            .isEmpty()
            .isLength({ max: 50 })
            .withMessage("The last name must have a maximum length of 50")
            .custom((value) => {
                var nameValidate = /^[A-Za-z]+$/;
                if (!nameValidate.test(value)) {
                    throw new Error("Invalid last name");
                }
                return true;
            })
            .trim(),

        // Phone number
        check("buyerPhone", "Phone number is required")
            .isLength({ min: 10, max: 15 })
            .withMessage("Invalid phone number length")
            .custom((value) => {
                var phoneValidate = /^(?:(?:\+|0{0,2})91(\s*[\-]\s*)?|[0]?)?[6789]\d{9}$/;
                if (!phoneValidate.test(value)) {
                    throw new Error("Invalid phone number format");
                }
                return true;
            })
            .trim(),

        // Amount
        check("amount", "Amount is required").not().isEmpty().isNumeric().trim(),

        // Email
        check("buyerEmail").isEmail().withMessage("Invalid email address").normalizeEmail(),

        // Currency
        check("currency", "Currency is required").not().isEmpty().trim(),

        // ISO Currency
        check("isocurrency", "ISO currency is required")
            .not()
            .isEmpty()
            .isLength({ min: 3, max: 3 })
            .withMessage("ISO currency must have a length of 3")
            .custom((value) => {
                var isoValidate = /^[A-Za-z]+$/;
                if (!isoValidate.test(value)) {
                    throw new Error("Invalid ISO currency format");
                }
                return true;
            })
            .trim(),

        // Order ID
        check("orderid", "Order ID is required").not().isEmpty().trim(),

        // Buyer Pin Code
        check("buyerPinCode")
            .optional()
            .custom((value) => {
                var pinValidate = /^[1-9]{1}[0-9]{2}\s{0,1}[0-9]{3}$/;
                if (value && !pinValidate.test(value)) {
                    throw new Error("Invalid pin code format");
                }
                return true;
            })
            .trim(),
    ],
    runValidation,
    async function (req, res, next) {
        try {
            const { amount, promoCode, isApplied, discount = 0, formData } = req.body;

            if (!req.user?.id) {
                return res.status(400).json({ message: "User not authenticated" });
            }

            // Step 1: Fetch cart
            const cart = await Cart.findOne({ userId: req.user.id }).populate({
                path: "items.vipNumberId",
                populate: { path: "owner" }
            });
            if (!cart || cart.items.length === 0) {
                return res.status(400).json({ message: "Cart is empty" });
            }

            // Step 2: Fetch margins
            const allMargins = await Margin.find();

            // Step 3: Calculate total price (same as addToCart)
            let totalPrice = 0;
            const validItems = cart.items.filter(i => i.vipNumberId);

            for (const item of validItems) {
                const vip = item.vipNumberId;
                const basePrice = vip.price || 0;
                const vipDiscount = vip.discount || 0;
                const priceAfterDiscount = Math.max(basePrice - vipDiscount, 0);

                // Find applicable margin
                const marginData = allMargins.find(
                    (m) => basePrice >= m.minPrice && basePrice <= m.maxPrice
                );
                const marginPercent = marginData ? marginData.marginPercent : 0;

                const finalPrice = priceAfterDiscount + (basePrice * marginPercent / 100);
                const roundedFinalPrice = Math.round(finalPrice / 10) * 10;

                totalPrice += roundedFinalPrice;
            }

            // Step 4: Add 18% GST
            const gst = totalPrice * 0.18;

            // Step 5: Apply promo/discount if any
            let promo = null;
            let promoDiscount = 0;
            if (isApplied && promoCode) {
                promo = await Promo.findOne({ code: promoCode });
                if (promo && promo.isActive) {
                    promoDiscount = promo.type === "percent"
                        ? (totalPrice * promo.value / 100)
                        : promo.value;
                }
            }

            const payableAmount = totalPrice + gst - promoDiscount;

            // Step 6: Validate frontend amount
            if (Number(amount) !== Number(payableAmount)) {
                return res.status(400).json({
                    message: `Amount mismatch. Expected ₹${payableAmount}, received ₹${amount}. Please refresh and try again.`,
                    serverCalculated: payableAmount
                });
            }

            // if (payableAmount < 1000) {
            //     return res.status(400).json({ message: "Minimum order amount is ₹1000" });
            // }
// console.log(payableAmount);
            // Step 7: Verify stock
            const vipNumbers = validItems.map(i => i.vipNumberId);
            const outOfStock = vipNumbers.filter(v => v.stock === 0);
            if (outOfStock.length > 0) {
                return res.status(400).json({
                    message: "Some numbers are sold just now, please remove them.",
                    outOfStock: outOfStock.map(v => v.number)
                });
            }

            // Step 8: Create order ID
            let orderCounter = await OrderCounter.findOne();
            if (!orderCounter) orderCounter = new OrderCounter();
            orderCounter.count += 1;
            await orderCounter.save();
            const orderid = `NA-${(Date.now() % 1000000)}${Math.floor(100 + Math.random() * 900)}`;

            // Step 9: Create order
            const newOrder = new Order({
                rzpOrderId: orderid,
                orderId: orderid,
                ...formData,
                promoCode: promo ? promo._id : null,
                price: totalPrice,
                discount: promoDiscount,
                totalPrice: payableAmount,
                gst,
                numbers: vipNumbers.map(v => v.number),
                numberPricePairs: vipNumbers.map(v => ({
                    number: v.number,
                    price: v.price
                })),
                customer: req.user.id,
                items: cart.items.map(i => ({ vipNumber: i.vipNumberId })),
                paymentStatus: "Pending",
            });

            await newOrder.save();

            var md5 = require('md5');
            var sha256 = require('sha256');
            var dateformat = require('dateformat');
            console.log({...req.body, payableAmount, orderid});
            alldata = req.body.buyerEmail + req.body.buyerFirstName + req.body.buyerLastName + req.body.buyerAddress + req.body.buyerCity + req.body.buyerState + req.body.buyerCountry + req.body.amount + req.body.orderid;
            udata = username + ':|:' + password;
            privatekey = sha256(secret + '@' + udata);
            keySha256 = sha256(username + "~:~" + password);
            aldata = alldata + dateformat(now, 'yyyy-mm-dd');
            // console.log(aldata);
            checksum = sha256(keySha256 + '@' + aldata); //md5(aldata+privatekey);
            fdata = req.body;
            res.json({ redirectUrl: `https://numberatm.com/sendtoairpay?orderid=${orderid}` });
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: "Server error", error });
        }
    }
);


router.post("/responsefromairpay", async function (req, res) {
    const transactionData = req.body;
    const { TRANSACTIONID: orderId, id, MESSAGE } = req.body;
    // console.log(req.body);
    const order = await Order.findOne({ orderId });
    const cart = await Cart.findOne({ userId: order.customer });
    const cartIds = cart.items.map(item => item.vipNumberId); // Extract VIPNumber IDs
    const vipNumbers = await VIPNumber.find({ _id: { $in: cartIds } });
    lastTransaction = {
        status: transactionData.TRANSACTIONSTATUS, // 200 for success, 400 for failure, etc.
        message: transactionData.MESSAGE,
        transactionId: transactionData.TRANSACTIONID,
        amount: transactionData.AMOUNT,
        customer: transactionData.CUSTOMER,
        customerEmail: transactionData.CUSTOMEREMAIL,
        transactionTime: transactionData.TRANSACTIONTIME,
        bankResponse: transactionData.BANKRESPONSEMSG
    };

    console.log("Transaction received:", req.body);

    // Determine redirect URL based on transaction status
    const isSuccess = transactionData.TRANSACTIONSTATUS === "200";
    const isCancelled = transactionData.TRANSACTIONSTATUS === "402";
    const isUnderProcess = transactionData.TRANSACTIONSTATUS === "211";
    // const isSuccess = transactionData.TRANSACTIONSTATUS === "200";
    if (isSuccess) {
        order.paymentStatus = "Paid";
        order.transactionTime = new Date();
        order.paymentMessage = MESSAGE,
            await VIPNumber.updateMany(
                { _id: { $in: vipNumbers } },
                { $set: { stock: 0, saleTime: new Date() } } // Corrected field name & Date object
            );
        await order.save();
        await Cart.findOneAndDelete({ userId: order.customer });
        await sendOrderEmail(order?.orderId);
        await sendOrderEmailCustomer(order?.orderId, "Paid");
    } else if (isCancelled) {
        order.paymentStatus = "Cancelled";
        order.transactionTime = new Date();
        order.paymentMessage = MESSAGE,
            await order.save();
        await Cart.findOneAndDelete({ userId: order.customer });
        await sendOrderEmail(order?.orderId, "Cancelled");
    } else if (isUnderProcess) {
        order.paymentStatus = "In Process";
        order.transactionTime = new Date();
        order.paymentMessage = MESSAGE,
            await order.save();
        await Cart.findOneAndDelete({ userId: order.customer });
        await sendOrderEmail(order?.orderId, "In Process");
    } else {
        order.paymentStatus = "Failed";
        order.transactionTime = new Date();
        order.paymentMessage = MESSAGE,
            await order.save();
        await sendOrderEmail(order?.orderId, "Failed");
    }

    const frontendURL = isSuccess
        ? `${process.env.frontendURL}/payment-success?transactionId=${transactionData.TRANSACTIONID}&time=${new Date()}`
        : isUnderProcess ? `${process.env.frontendURL}/payment-in-progress?transactionId=${transactionData.TRANSACTIONID}&time=${new Date()}`
            : isCancelled ? `${process.env.frontendURL}/payment-cancelled?transactionId=${transactionData.TRANSACTIONID}&time=${new Date()}` : `${process.env.frontendURL}/payment-failed?transactionId=${transactionData.TRANSACTIONID}&time=${new Date()}`
        ;

    res.redirect(frontendURL);
});
router.post('/ipn-callback', async (req, res) => {
    try {
        const data = req.body;

        const {
            TRANSACTIONID,
            APTRANSACTIONID,
            AMOUNT,
            TRANSACTIONSTATUS,
            MESSAGE,
            MERCID,
            ap_SecureHash,
            TRANSACTIONTIME,
            CUSTOMERVPA, // optional, used in UPI hash
        } = data;
        console.log('IPN Data:', data);
        // Your merchant credentials (replace with actual values)
        const MID = process.env.AIRPAY_MERCHANT_ID;
        const USERNAME = process.env.AIRPAY_USERNAME;

        // Create the string to hash
        // let hashString = `${TRANSACTIONID}:${APTRANSACTIONID}:${AMOUNT}:${TRANSACTIONSTATUS}:${MESSAGE}:${MERCID}:${USERNAME}`;
        // if (CUSTOMERVPA) {
        //   hashString += `:${CUSTOMERVPA}`;
        // }

        // // Compute the hash
        // const expectedHash = require('crc').crc32(hashString).toString();

        // // Verify the hash
        // if (expectedHash !== ap_SecureHash) {
        //   return res.status(400).send('Invalid hash');
        // }

        // Now update order status as in your real-time response
        const orderId = TRANSACTIONID; // this is your original order ID
        let status = 'pending';

        switch (Number(TRANSACTIONSTATUS)) {
            case 200:
                status = 'success';
                break;
            case 211:
                status = 'processing';
                break;
            case 400:
                status = 'failed';
                break;
            case 401:
                status = 'dropped';
                break;
            case 402:
            case 502:
                status = 'cancelled';
                break;
            case 403:
                status = 'incomplete';
                break;
            case 405:
                status = 'bounced';
                break;
            case 503:
                status = 'no_record';
                break;
            default:
                status = 'unknown';
        }
        // const parsedTime = dayjs(TRANSACTIONTIME, 'DD-MM-YYYY HH:mm:ss').toDate();
        // Update order in DB
        const updatedOrder = await Order.findOneAndUpdate(
            { orderId: orderId }, // your DB field that stores order id
            {
                $set: {
                    status: status,
                    paymentId: APTRANSACTIONID,
                    paymentMessage: MESSAGE,
                    transactionTime: new Date(),
                },
            },
            { new: true }
        );

        if (!updatedOrder) {
            return res.status(404).send('Order not found');
        }
        console.log('IPN processed successfully')
        res.status(200).send('IPN processed successfully');
    } catch (error) {
        console.error('IPN error:', error);
        res.status(500).send('Server error');
    }
});

const setNumbersToOrders = async () => {
    const orders = await Order.find();
    // console.log("started!");
    for (const order of orders) {
        // console.log(order.orderId);
        const items = order.items;
        const ids = items.map(item => item.vipNumber);
        const vipNumbers = await VIPNumber.find({ _id: { $in: ids } });
        const numbers = vipNumbers.map(item => item.number);
        order.numbers = numbers; // Set instead of push
        await order.save();
    }
    // console.log("ended!");
};
//   setNumbersToOrders();
module.exports = router;
