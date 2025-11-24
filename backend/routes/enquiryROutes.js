const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const dotenv = require('dotenv');
const Enquiry = require('../models/Enquiry');
const VIPNumber = require('../models/vipNumber');
const Order = require('../models/Order');

dotenv.config();
router.get('/', async (req, res) => {
    try {
        const enquiries = await Enquiry.find().sort({ createdAt: -1 }).populate('VIPNumber');
        res.status(200).json(enquiries);
    } catch (error) {
        console.error('Error fetching enquiries:', error);
        res.status(500).json({ message: 'Server error while fetching enquiries' });
    }
});
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEnquiry = await Enquiry.findByIdAndDelete(id);

    if (!deletedEnquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    res.status(200).json({ message: 'Enquiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
})
const BATCH_SIZE = 100;

async function setNumber() {
  console.log("✅ setNumber started...");

  const enquiries = await Enquiry.find();
  console.log(`📦 Total enquiries to process: ${enquiries.length}`);
  
  for (let i = 0; i < enquiries.length; i += BATCH_SIZE) {
    const batch = enquiries.slice(i, i + BATCH_SIZE);

    // Fetch all VIP numbers for this batch in parallel
    const vipIds = batch.map(enquiry => enquiry.VIPNumber);
    const vipNumbers = await VIPNumber.find({ _id: { $in: vipIds } });

    // Map VIPNumber by ID for quick lookup
    const vipMap = {};
    vipNumbers.forEach(vip => {
      vipMap[vip._id] = vip.number;
    });

    // Assign and save all enquiries in parallel
    await Promise.all(
      batch.map(async (enquiry) => {
        enquiry.fullNumber = vipMap[enquiry.VIPNumber] || null;
        return enquiry.save();
      })
    );
  }
  console.log("✅ setNumber finished successfully!");
}
// setNumber();
async function setNumberPricePairsInOrders() {
  console.log("✅ Starting to update existing orders with numberPricePairs...");

  const allOrders = await Order.find().lean(); // Use .lean() for performance
  console.log(`📦 Total Orders to process: ${allOrders.length}`);

  for (let i = 0; i < allOrders.length; i += BATCH_SIZE) {
    const batch = allOrders.slice(i, i + BATCH_SIZE);

    // Get all unique VIPNumber IDs in this batch
    const vipIds = batch.flatMap(order =>
      order.items.map(item => item.vipNumber)
    );

    // Fetch the corresponding VIPNumber docs
    const vipNumbers = await VIPNumber.find({ _id: { $in: vipIds } }).lean();

    // Create a lookup map
    const vipMap = {};
    vipNumbers.forEach(vip => {
      vipMap[vip._id.toString()] = {
        number: vip.number,
        price: vip.price,
      };
    });

    // Process and update each order
    await Promise.all(
      batch.map(async (order) => {
        const numberPricePairs = order.items.map(item => {
          const data = vipMap[item.vipNumber?.toString()];
          return data ? { number: data.number, price: data.price } : null;
        }).filter(Boolean); // Remove nulls (in case VIPNumber was deleted)

        await Order.updateOne(
          { _id: order._id },
          { $set: { numberPricePairs } }
        );
      })
    );

    console.log(`✅ Processed batch ${i / BATCH_SIZE + 1}`);
  }

  console.log("🎉 All orders updated with numberPricePairs!");
}
// setNumberPricePairsInOrders();
router.post('/', async (req, res) => {
  const { name, email, number, VIPNumber,fullNumber, subject, message } = req.body;

  try {
    // Save to DB
    const newEnquiry = new Enquiry({
      name,
      email,
      number,
      fullNumber,
      VIPNumber,
      subject,
      message,
      
    });

    const savedEnquiry = await newEnquiry.save();

    // Populate VIPNumber if it’s a reference
    const populatedEnquiry = await Enquiry.findById(savedEnquiry._id).populate('VIPNumber');

    // Send Email
    const transporter = nodemailer.createTransport({
      service: 'Gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    const vipNumberValue =
      (populatedEnquiry.VIPNumber && populatedEnquiry.VIPNumber.number) || 'N/A';

      const mailOptions = {
        from: email,
        to: process.env.GMAIL_RECEIVER,
        subject: `New Enquiry: ${subject}`,
        html: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f3f4f6; padding: 30px;">
            <table width="100%" style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);">
              <tr>
                <td style="background-color: #1e3a8a; padding: 25px; text-align: center;">
                  <h2 style="color: #ffffff; margin: 0; font-size: 24px;">📩 New Enquiry Notification For ${vipNumberValue}</h2>
                </td>
              </tr>
              <tr>
                <td style="padding: 30px;">
                  <p style="font-size: 16px; color: #111827; margin-bottom: 20px;">
                    You have received a new enquiry from your website:
                  </p>
      
                  <table style="width: 100%; font-size: 15px; color: #374151;">
                    <tr>
                      <td style="padding: 10px 0;"><strong>Name:</strong></td>
                      <td style="padding: 10px 0;">${name}</td>
                    </tr>
                    <tr style="background-color: #f9fafb;">
                      <td style="padding: 10px 0;"><strong>Email:</strong></td>
                      <td style="padding: 10px 0;">${email}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0;"><strong>Phone Number:</strong></td>
                      <td style="padding: 10px 0;">${number}</td>
                    </tr>
                    <tr style="background-color: #f9fafb;">
                      <td style="padding: 10px 0;"><strong>VIP Number:</strong></td>
                      <td style="font-weight: bold; padding: 10px 0;">${vipNumberValue}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px 0;"><strong>Subject:</strong></td>
                      <td style="padding: 10px 0;">${subject}</td>
                    </tr>
                    <tr style="background-color: #f9fafb;">
                      <td style="padding: 10px 0; vertical-align: top;"><strong>Message:</strong></td>
                      <td style="padding: 10px 0; white-space: pre-line;">${message}</td>
                    </tr>
                  </table>
      
                  <div style="margin-top: 30px; text-align: center;">
                    <a href="mailto:${email}" style="display: inline-block; padding: 10px 20px; background-color: #1e3a8a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: bold;">Reply Now</a>
                  </div>
                </td>
              </tr>
              <tr>
                <td style="background-color: #e5e7eb; text-align: center; padding: 15px; font-size: 12px; color: #6b7280;">
                  This message was sent automatically via your website contact form. Do not share sensitive information.
                </td>
              </tr>
            </table>
          </div>
        `,
      };
      

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: 'Enquiry submitted and stored' });
  } catch (error) {
    console.error('Enquiry Error:', error);
    res.status(500).json({ error: 'Failed to process enquiry' });
  }
});

module.exports = router;

