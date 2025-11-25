const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
const Order = require("../models/Order");

// doc.font("Helvetica-Bold").text(`SGST: Rs. ${order.sgst}`);
// doc.font("Helvetica-Bold").text(`CGST: Rs. ${order.cgst}`);

exports.generateInvoice = async (req, res) => {
    try {
        const { id: orderId } = req.params;
        const order = await Order.findOne({ orderId }).populate("customer").populate("items.vipNumber");

        if (!order) {
            return res.status(404).json({ message: "Order not found" });
        }
        // Set the response content type to 'application/pdf'
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice_${orderId}.pdf"`);

        // Create the PDF document
        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(res);

        // Header
        doc.fontSize(24).font("Helvetica-Bold").text("NumberAtm Order Receipt", { align: "center" });
        doc.moveDown();
        doc.fontSize(12).font("Helvetica").text("Thank you for your purchase at NumberAtm!", { align: "center" });
        doc.moveDown(2);

        // Order Info
        doc.fontSize(14).font("Helvetica-Bold").text("Order Details", { underline: true });
        doc.moveDown();
        doc.fontSize(12).font("Helvetica-Bold").text(`Order ID: ${order.orderId}`);
        doc.text(`Date: ${new Date(order.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric'})}`);
        doc.text(`Payment Status: ${order.paymentStatus}`);
        doc.moveDown();

        // Customer Info
        doc.fontSize(14).font("Helvetica-Bold").text("Billing Details", { underline: true });
        doc.moveDown();
        doc.fontSize(12).font("Helvetica").text(`${order.firstName} ${order.lastName}`);
        doc.text(order.email);
        doc.text(`Phone: ${order.phone}`);
        doc.text(`${order.streetAddress}, ${order.city}, ${order.state} - ${order.pincode}, ${order.country}`);
        doc.moveDown();

        // Items
        doc.fontSize(14).font("Helvetica-Bold").text("Order Items", { underline: true });
        doc.moveDown();
        order.items.forEach((item, index) => {
            doc.fontSize(12).font("Helvetica-Bold").text(`${index + 1}. VIP Number: ${item.vipNumber.number}`);
        });
        doc.moveDown();

        // Pricing Details
        doc.fontSize(14).font("Helvetica-Bold").text("Payment Summary", { underline: true });
        doc.moveDown();
        doc.fontSize(12).font("Helvetica-Bold").text(`Subtotal: Rs. ${parseFloat(order.price).toFixed(2)}`);
        { order.discount && doc.font("Helvetica-Bold").text(`Discount: ₹${parseFloat(order.discount).toFixed(2)}`); }
        doc.font("Helvetica-Bold").text(`Total Price: Rs. ${parseFloat(order.totalPrice).toFixed(2)}`, { bold: true });
        doc.font("Helvetica-Bold").text(`GST: Rs. ${parseFloat(order.gst).toFixed(2)}`);
        doc.moveDown();

        // Footer
        doc.moveDown(2);
        doc.fontSize(10).font("Helvetica-Oblique").text("For any support, contact us at support@numberatm.com", { align: "center" });
        doc.text("Website: www.numberatm.com", { align: "center" });

        doc.end();
    } catch (error) {
        res.status(500).json({ message: "Internal server error", error: error.message });
    }
};
