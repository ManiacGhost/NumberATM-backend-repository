const express = require('express');
const router = express.Router();
const dotenv = require('dotenv');
const { verifyPayment, createOrder, initiatePayment, verifyPaymentAirpay } = require('../controllers/paymentController');
const { authMiddleware } = require('../middlewares/authMiddleware');
dotenv.config();
router.get('/getkey', (req,res)=>{ try{return res.status(200).json(process.env.RAZORPAY_KEY_ID)}catch(e){
    console.log(e);
}});
router.post('/create-order',authMiddleware, createOrder);
router.post('/verify-payment',authMiddleware, verifyPayment);
// router.get("/check", checkAdmin);
module.exports = router;
