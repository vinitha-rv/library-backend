const Payment = require("../models/Payment");
const Book = require("../models/Book"); // Import Book model to get price
const mongoose = require("mongoose"); // For ObjectId validation

exports.handlePayment = async (req, res) => {
  try {
    const { userId, books, totalAmount, method, name, cardNumber, expiry, cvv, upiId } = req.body;

    // Basic validation
    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid or missing User ID." });
    }
    if (!method || !["card", "upi", "cod"].includes(method)) {
      return res.status(400).json({ message: "Invalid or missing payment method." });
    }
    if (!books || !Array.isArray(books) || books.length === 0) {
      return res.status(400).json({ message: "No books specified for purchase." });
    }
    if (typeof totalAmount !== 'number' || totalAmount <= 0) {
        return res.status(400).json({ message: "Invalid total amount." });
    }

    // Validate books and fetch their current prices
    const purchasedBooks = [];
    let calculatedTotal = 0; // Server-side calculation for security

    for (const item of books) {
        if (!item.bookId || !mongoose.Types.ObjectId.isValid(item.bookId) || typeof item.quantity !== 'number' || item.quantity <= 0) {
            return res.status(400).json({ message: "Invalid book item in purchase list." });
        }
        const book = await Book.findById(item.bookId);
        if (!book) {
            return res.status(404).json({ message: `Book with ID ${item.bookId} not found.` });
        }
        if (book.stock < item.quantity) {
            return res.status(400).json({ message: `Not enough stock for book: ${book.title}. Available: ${book.stock}, Requested: ${item.quantity}` });
        }
        purchasedBooks.push({
            bookId: item.bookId,
            quantity: item.quantity,
            priceAtPurchase: book.price, // Store the price at time of purchase
        });
        calculatedTotal += book.price * item.quantity;
    }

    // Add shipping cost to server-calculated total
    calculatedTotal += 50;

    // Basic check to see if frontend total matches backend calculated total (within a small tolerance)
    if (Math.abs(calculatedTotal - totalAmount) > 0.01) {
        // This tolerance might be needed for floating point numbers or if taxes are dynamically added etc.
        console.warn(`Frontend total (${totalAmount}) deviates from backend calculated total (${calculatedTotal}).`);
        // return res.status(400).json({ message: "Total amount mismatch." }); // Uncomment in production
    }

    let paymentData = {
      userId,
      books: purchasedBooks,
      totalAmount: calculatedTotal, // Use server-calculated total
      method,
      status: "Paid", // Default status for online payments
    };

    if (method === "card") {
      if (!name || !cardNumber || !expiry || !cvv) {
        return res.status(400).json({ message: "All card fields (name, number, expiry, cvv) are required for card payment." });
      }
      paymentData = { ...paymentData, name, cardNumber, expiry, cvv };
    } else if (method === "upi") {
      if (!upiId) {
        return res.status(400).json({ message: "UPI ID is required for UPI payment." });
      }
      paymentData = { ...paymentData, upiId };
    } else if (method === "cod") {
      paymentData.status = "COD - To be collected"; // Update status for COD
      // For COD, we still record the "payment" but its status is different
    }

    // Create and save the new payment record
    const newPayment = new Payment(paymentData);
    await newPayment.save();

    // Optionally, decrement stock for purchased books
    for (const item of books) {
        await Book.findByIdAndUpdate(item.bookId, { $inc: { stock: -item.quantity } });
    }

    res.status(201).json({ message: `✅ ${method.toUpperCase()} order successfully recorded!` });
  } catch (error) {
    console.error("❌ Error saving payment:", error);
    // Provide a more generic error message for the user if specific error is sensitive
    res.status(500).json({ message: "Server error during payment processing. Please try again.", error: error.message });
  }
};