const mongoose = require("mongoose");

const leaveSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  startDate: Date,
  endDate: Date,
  workloadPercentage: Number,
  deadlineConflict: Boolean,
  impactScore: Number,
  status: String,
  decisionReason: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Leave", leaveSchema);