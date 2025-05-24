// server/models/ContactMessage.js
const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: {
    type: String, required: true, trim: true, lowercase: true,
    match: [/.+@.+\..+/, 'Invalid email']
  },
  subject: { type: String, trim: true, default: 'No Subject' },
  message: { type: String, required: true, trim: true },
  read: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model("ContactMessage", contactMessageSchema);