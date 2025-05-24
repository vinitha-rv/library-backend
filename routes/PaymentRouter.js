// routes/payment.js
const express = require("express");
const router = express.Router();
const Payment = require("../models/Payment"); // make sure path is correct

router.post("/", async (req, res) => {
  try {
    const { amount, method, name, cardNumber, expiry, cvv, upiId } = req.body;

    if (amount === undefined || amount < 0) {
      return res.status(400).json({ message: "Invalid amount" });
    }

    let paymentData = { amount, method };

    if (method === "card") {
      if (!name || !cardNumber || !expiry || !cvv) {
        return res.status(400).json({ message: "Card details required" });
      }

      paymentData.cardholderName = name;
      paymentData.last4CardDigits = cardNumber.slice(-4);
      paymentData.cardExpiry = expiry;
    } else if (method === "upi") {
      if (!upiId) {
        return res.status(400).json({ message: "UPI ID is required" });
      }
      paymentData.upiId = upiId;
    } else if (method === "cod") {
      // No extra data needed for Cash on Delivery
    } else {
      return res.status(400).json({ message: "Invalid payment method" });
    }

    const payment = new Payment(paymentData);
    await payment.save();

    res.status(201).json({ message: "Payment successful", payment });
  } catch (error) {
    console.error("Payment error:", error.message);
    res.status(500).json({ message: "Payment failed", error: error.message });
  }
});

module.exports = router;

