const mongoose = require("mongoose");

const TransactionSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  category: {
    type: String,
    enum: ["Needs", "Wants", "Savings"],
    required: true
  },
  date: {
    type: Number,
    required: true
  },
  description: {
    type: String,
    required: true
  }
});

const UserSchema = new mongoose.Schema({
  phone: {
    type: String,
    required: true,
    unique: true,
    sparse: true // Allows multiple null/undefined if deviceId is used
  },
  name: {
    type: String,
    default: ""
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  otp: {
    type: String,
    select: false // Do not include in normal queries
  },
  otpExpires: {
    type: Date,
    select: false
  },
  deviceId: {
    type: String,
    unique: true,
    sparse: true
  },
  level: {
    type: String,
    enum: ["Rookie", "Explorer", "Master"],
    default: null
  },
  progressMap: {
    type: Map,
    of: Number, // Module completion percentage
    default: {}
  },
  monthly_budget: {
    type: Number,
    default: 0
  },
  transactions: [TransactionSchema],
  lastSynced: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

module.exports = mongoose.model("User", UserSchema);
