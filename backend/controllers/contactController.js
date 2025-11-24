const Contact = require('../models/Contact');
const nodemailer = require('nodemailer');

// Submit a new contact query
const submitContactForm = async (req, res) => {
  const { name, email, subject, message, contact } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    const newContact = new Contact({ name, email, subject, message, contact });
    await newContact.save();

    // Email configuration
    const transporter = nodemailer.createTransport({
      service: 'gmail', // Change if you're using another provider
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS,
      },
    });

    // Stylish HTML email
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px; background-color: #f9f9f9;">
        <h2 style="color: #2c3e50;">📩 New Contact Form Submission</h2>
        <p style="font-size: 16px;"><strong>Name:</strong> ${name}</p>
        <p style="font-size: 16px;"><strong>Email:</strong> ${email}</p>
        <p style="font-size: 16px;"><strong>Subject:</strong> ${subject}</p>
        <div style="margin-top: 20px;">
          <p style="font-size: 16px; margin-bottom: 5px;"><strong>Message:</strong></p>
          <div style="padding: 15px; background: #fff; border: 1px solid #ccc; border-radius: 4px;">
            <p style="font-size: 15px; color: #333;">${message}</p>
          </div>
        </div>
        <footer style="margin-top: 30px; font-size: 13px; color: #777;">
          <p>Sent from the contact form on <strong>NumberATM</strong></p>
        </footer>
      </div>
    `;

    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: 'info@numberatm.com',
      subject: `New Contact Form Query: ${subject}`,
      html: htmlContent,
    };

    await transporter.sendMail(mailOptions);

    res.status(201).json({ message: 'Message submitted successfully.' });
  } catch (error) {
    console.error('Error in contact form submission:', error);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
};

// Fetch all contact queries for admin
const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.status(200).json(contacts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch contact queries.' });
  }
};

// Mark a contact query as "read"
const markAsRead = async (req, res) => {
  const { id } = req.params;

  try {
    const contact = await Contact.findById(id);
    if (!contact) return res.status(404).json({ error: 'Contact query not found.' });

    contact.status = 'read';
    await contact.save();
    res.status(200).json({ message: 'Query marked as read successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update contact query status.' });
  }
};
const deleteContact = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedEnquiry = await Contact.findByIdAndDelete(id);

    if (!deletedEnquiry) {
      return res.status(404).json({ message: 'Enquiry not found' });
    }

    res.status(200).json({ message: 'Enquiry deleted successfully' });
  } catch (error) {
    console.error('Error deleting enquiry:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

module.exports = { submitContactForm, getAllContacts, markAsRead, deleteContact };