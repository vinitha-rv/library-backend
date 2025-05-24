// server/models/Book.js
const mongoose = require('mongoose');

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  category: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  image: { type: String },
  seriesNumber: { type: String },
  stock: { type: Number, default: 0 },
});

module.exports = mongoose.model("Book", bookSchema);