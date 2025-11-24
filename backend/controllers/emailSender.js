const nodemailer = require("nodemailer");
const Order = require("../models/Order");
const dotenv = require("dotenv");
const Cart = require("../models/Cart");
dotenv.config();
{/* <p><strong>SGST:</strong> ₹${parseFloat(order.sgst).toFixed(2)}</p>
                        <p><strong>CGST:</strong> ₹${parseFloat(order.cgst).toFixed(2)}</p> */}
const sendOrderEmail = async (orderId, statusLabel = "Pending") => {
    try {
        // Fetch order details
        const order = await Order.findOne({ orderId })
            .populate("customer")
            .populate("items.vipNumber");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Email recipient
        const recipientEmail = process.env.GMAIL_RECEIVER;

        // Configure email transporter
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_PASS,
            },
        });

        // Email content
        const mailOptions = {
            from: "NumberAtm",
            to: recipientEmail,
            subject: `📦 Order ${statusLabel} - ${order.orderId} | NumberAtm`,
            html: `
                                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 10px; padding: 20px; background-color: #f9f9f9;">
                                            <h2 style="text-align: center; color: #333;">📢 Order ${statusLabel} - NumberAtm</h2>
                                            <hr style="border: 1px solid #ddd;">
                                            <p style="font-size: 16px;"><strong>Order ID:</strong> ${order.orderId}</p>
                                            <p style="font-size: 16px;"><strong>Customer:</strong> ${order.firstName} ${order.lastName}</p>
                                            <p style="font-size: 16px;"><strong>Phone:</strong> ${order.phone}</p>
                                            <p style="font-size: 16px;"><strong>Email:</strong> ${order.email}</p>
                                            <p style="font-size: 16px;"><strong>Address:</strong> ${order.streetAddress}, ${order.city}, ${order.state}, ${order.pincode}, ${order.country}</p>
                                            <p style="font-size: 16px;"><strong>Operator:</strong> ${order.operator}</p>
                                            <p style="font-size: 16px;"><strong>SIM Type:</strong> ${order.simType}</p>
                                            <hr style="border: 1px solid #ddd;">
                                            <h3 style="color: #333;">💰 Payment Details</h3>
                                            <p><strong>Price:</strong> ₹${parseFloat(order.price).toFixed(2)}</p>
                                            <p><strong>Discount:</strong> ₹${parseFloat(order.discount).toFixed(2)}</p>
                                            <p><strong>Total Price:</strong> ₹${parseFloat(order.totalPrice).toFixed(2)}</p>
                                            <p style="font-size: 16px;"><strong>Status:</strong> ${order.status}</p>
                                            <p style="font-size: 16px;"><strong>Payment Status:</strong> ${order.paymentStatus}</p>
                                            <hr style="border: 1px solid #ddd;">
                                            <h3 style="color: #333;">📋 Ordered Items</h3>
                                            <ul>
                                                ${order.items.map(item => `<li style="font-size: 16px;">VIP Number: ${item.vipNumber.number}</li>`).join(" ")}
                                            </ul>
                                            <hr style="border: 1px solid #ddd;">
                                            <p style="text-align: center; font-size: 14px; color: #777;">Thank you for choosing NumberAtm 🚀</p>
                                        </div>
                                    `,
        };

        // Send email
        await transporter.sendMail(mailOptions);

    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

const sendOrderEmailCustomer = async (orderId) => {
    try {
        // Fetch order details
        const order = await Order.findOne({ orderId }).populate("customer").populate("items.vipNumber");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }

        // Configure email transporter
        const transporter = nodemailer.createTransport({
            service: "Gmail",
            auth: {
                user: process.env.GMAIL_USER, // Replace with your email
                pass: process.env.GMAIL_PASS, // Use app password or secure method
                // user: "ishudaksh2603@gmail.com", // Replace with your email
                // pass: "qtib pntk fqtw keux", // Use app password or secure method
            },
        });

        // Email content with improved layout
        const mailOptions = {
            from: "NumberAtm",
            to: order.email,
            subject: `Your payment was successful, Order ID - ${order.orderId} | NumberAtm`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; padding: 20px; background-color: #ffffff;">
                    <h2 style="text-align: center; color: #4CAF50; font-size: 24px;">📢 Order Notification - NumberAtm</h2>
                    <hr style="border: 1px solid #e0e0e0; margin: 20px 0;">
                    
                    <div style="padding: 10px;">
                        <h3 style="color: #333;">🛒 Order Details</h3>
                        <p><strong>Order ID:</strong> ${order.orderId}</p>
                        <p><strong>Customer:</strong> ${order.firstName} ${order.lastName}</p>
                        <p><strong>Phone:</strong> ${order.phone}</p>
                        <p><strong>Email:</strong> ${order.email}</p>
                        <p><strong>Address:</strong> ${order.streetAddress}, ${order.city}, ${order.state}, ${order.pincode}, ${order.country}</p>
                        <p><strong>Operator:</strong> ${order.operator}</p>
                        <p><strong>SIM Type:</strong> ${order.simType}</p>
                    </div>
                    
                    <hr style="border: 1px solid #e0e0e0;">
                    
                    <div style="padding: 10px;">
                        <h3 style="color: #333;">💰 Payment Details</h3>
                        <p><strong>Price:</strong> ₹${parseFloat(order.price).toFixed(2)}</p>
                        <p><strong>Discount:</strong> ₹${parseFloat(order.discount).toFixed(2)}</p>
                        <p><strong>Total Price:</strong> ₹${parseFloat(order.totalPrice).toFixed(2)}</p>
                        <p><strong>Gst:</strong> ₹${parseFloat(order.gst).toFixed(2)}</p>
                        <p><strong>Status:</strong> ${order.status}</p>
                        <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
                    </div>
                    
                    <hr style="border: 1px solid #e0e0e0;">
                    
                    <div style="padding: 10px;">
                        <h3 style="color: #333;">📋 Ordered Items</h3>
                        <ul>
                            ${order.items.map(item => `<li style="font-weight: bold, font-size: 16px; color: #555;">VIP Number: ${item.vipNumber.number}</li>`).join("")}
                        </ul>
                    </div>
                    
                    <hr style="border: 1px solid #e0e0e0;">
                    
                    <p style="text-align: center; font-size: 14px; color: #777;">Thank you for choosing NumberAtm !</p>
                </div>
            `,
        };

        // Send email
        await transporter.sendMail(mailOptions);

        // res.status(200).json({ message: "Email sent successfully" });
    } catch (error) {
        console.error("Error sending email:", error);
        res.status(500).json({ message: "Internal Server Error" });
    }
};

// const clearCart = async(req,res)=>{
//     try{
//         const cart = await Cart.findOne({userId:req.user.id})
//     }
// }
module.exports = { sendOrderEmail, sendOrderEmailCustomer };
