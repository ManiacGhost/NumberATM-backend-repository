const mongoose = require('mongoose');

const contactSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, trim: true, match: [/.+\@.+\..+/, 'Invalid email address'] },
  subject: { type: String, required: true, trim: true },
  contact: { type: String, trim: true },
  message: { type: String, required: true, trim: true },
  status: { type: String, enum: ['unread', 'read'], default: 'unread' },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Contact', contactSchema);