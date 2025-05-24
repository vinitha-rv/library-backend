const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
const PORT = 5000;

// --- Middleware ---
app.use(cors());
app.use(express.json());

// --- MongoDB Connection ---
mongoose.connect("mongodb://localhost:27017/bookstore");
const db = mongoose.connection;

db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("✅ Connected to MongoDB");
});

// --- Schemas and Models ---

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
const Book = mongoose.model("Book", bookSchema);

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);

const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, required: true, enum: ["card", "upi", "cod"] },
  cardholderName: {
    type: String,
    required: function () {
      return this.method === "card";
    },
  },
  last4CardDigits: {
    type: String,
    required: function () {
      return this.method === "card";
    },
  },
  cardExpiry: {
    type: String,
    required: function () {
      return this.method === "card";
    },
  },
  upiId: {
    type: String,
    required: function () {
      return this.method === "upi";
    },
  },
  transactionId: { type: String, unique: true, sparse: true },
  paymentDate: { type: Date, default: Date.now },
  status: {
    type: String,
    default: "success",
    enum: ["pending", "success", "failed", "pending_delivery"],
  },
});
const Payment = mongoose.model("Payment", paymentSchema);

const contactMessageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [/.+@.+\..+/, "Invalid email"],
    },
    subject: { type: String, trim: true, default: "No Subject" },
    message: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);
const ContactMessage = mongoose.model("ContactMessage", contactMessageSchema);

// --- Routes ---

// Register User
app.post("/api/users/register", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: "All fields are required." });
    }
    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });
    if (existingUser) {
      return res
        .status(409)
        .json({ message: "Username or email already exists." });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({
      name,
      username,
      email,
      password: hashedPassword,
    });
    await newUser.save();
    res.status(201).json({ message: "Registration successful!" });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", error: err.message });
  }
});

// Login User
app.post("/api/users/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: "Invalid email or password." });
    }
    res.status(200).json({
      message: "Login successful",
      token: "dummy-auth-token",
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    res.status(500).json({ message: "Login failed", error: err.message });
  }
});

// Delete User
app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid user ID." });
    }
    const deleted = await User.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "User not found." });
    res.status(200).json({ message: "User deleted successfully." });
  } catch (err) {
    res.status(500).json({ message: "Delete failed", error: err.message });
  }
});

// Add Book
app.post("/api/books", async (req, res) => {
  try {
    const newBook = new Book(req.body);
    await newBook.save();
    res.status(201).json({ message: "Book added", book: newBook });
  } catch (err) {
    res.status(500).json({ message: "Failed to add book", error: err.message });
  }
});

// Get All Books
app.get("/api/books", async (req, res) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch books", error: err.message });
  }
});

// Get Book by ID
app.get("/api/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book ID." });
    }
    const book = await Book.findById(id);
    if (!book) return res.status(404).json({ message: "Book not found." });
    res.status(200).json(book);
  } catch (err) {
    res.status(500).json({ message: "Error fetching book", error: err.message });
  }
});

// Update Book
app.put("/api/books/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid book ID." });
    }
    const updatedBook = await Book.findByIdAndUpdate(id, req.body, { new: true });
    if (!updatedBook) return res.status(404).json({ message: "Book not found." });
    res.status(200).json({ message: "Book updated", book: updatedBook });
  } catch (err) {
    res.status(500).json({ message: "Failed to update book", error: err.message });
  }
});

// Search Books
app.get("/api/books/search", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.status(400).json({ message: "Search query required." });
    const regex = new RegExp(query, "i");
    const results = await Book.find({ $or: [{ title: regex }, { author: regex }] });
    if (!results.length) return res.status(404).json({ message: "No books found." });
    res.status(200).json(results);
  } catch (err) {
    res.status(500).json({ message: "Search failed", error: err.message });
  }
});

// Get Books by Category
app.get("/api/books/category/:categoryName", async (req, res) => {
  try {
    const { categoryName } = req.params;
    const books = await Book.find({ category: { $regex: categoryName, $options: "i" } });
    if (!books.length) return res.status(404).json({ message: `No books in category: ${categoryName}` });
    res.status(200).json(books);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch category", error: err.message });
  }
});

// Submit Contact Message
app.post("/api/contact", async (req, res) => {
  try {
    const message = new ContactMessage(req.body);
    await message.save();
    res.status(201).json({ message: "Message sent successfully." });
  } catch (err) {
    res.status(500).json({ message: "Failed to send message", error: err.message });
  }
});

// Payment Processing (FIXED)
app.post("/api/payments", async (req, res) => {
  try {
    const { amount, method, name, cardNumber, expiry, cvv, upiId } = req.body;

    if (amount === undefined || amount < 0) {
      return res.status(400).json({ message: "Invalid payment amount." });
    }
    if (!["card", "upi", "cod"].includes(method)) {
      return res.status(400).json({ message: "Invalid payment method." });
    }

    let paymentData = { amount, method };

    if (method === "card") {
      if (!name || !cardNumber || !expiry || !cvv) {
        return res.status(400).json({ message: "Card details are required." });
      }
      const last4 = cardNumber.slice(-4);
      paymentData.cardholderName = name;
      paymentData.last4CardDigits = last4;
      paymentData.cardExpiry = expiry;
    }

    if (method === "upi") {
      if (!upiId) {
        return res.status(400).json({ message: "UPI ID is required." });
      }
      paymentData.upiId = upiId;
      paymentData.transactionId = "TXN" + Date.now();
    }

    const newPayment = new Payment(paymentData);
    await newPayment.save();

    res.status(201).json({
      message: "Payment processed successfully.",
      paymentId: newPayment._id,
      status: newPayment.status,
    });
  } catch (err) {
    res.status(500).json({ message: "Payment failed", error: err.message });
  }
});

// --- Server Start ---
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
