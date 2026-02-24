const Leave = require("../models/Leave");
const { analyzeWorkload } = require("../services/workloadService");
const { evaluateLeave } = require("../services/ruleEngine");

async function applyLeave(req, res) {
  try {

    const { userId, startDate, endDate } = req.body;

    const { workloadPercentage, deadlineConflict } =
      await analyzeWorkload(userId, startDate, endDate);

    const { status, decisionReason, impactScore } =
      evaluateLeave(workloadPercentage, deadlineConflict);

    const leave = await Leave.create({
      userId,
      startDate,
      endDate,
      workloadPercentage,
      deadlineConflict,
      impactScore,
      status,
      decisionReason
    });

    res.json({
      message: "Leave processed successfully",
      leave
    });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { applyLeave };