// Payment Schema
const paymentSchema = new mongoose.Schema({
  amount: { type: Number, required: true, min: 0 },
  method: { type: String, required: true, enum: ['card', 'upi', 'cod'] },
  cardholderName: {
    type: String,
    required: function() { return this.method === 'card'; } // <-- PROBLEM 1 FIXED
  },
  last4CardDigits: {
    type: String,
    required: function() { return this.method === 'card'; } // <-- PROBLEM 2 FIXED
  },
  cardExpiry: {
    type: String,
    required: function() { return this.method === 'card'; } // <-- PROBLEM 3 FIXED
  },
  upiId: {
    type: String,
    required: function() { return this.method === 'upi'; }
  },
  transactionId: { type: String, unique: true, sparse: true },
  paymentDate: { type: Date, default: Date.now },
  status: { type: String, default: 'success', enum: ['pending', 'success', 'failed', 'pending_delivery'] },
});
const Payment = mongoose.model("Payment", paymentSchema);