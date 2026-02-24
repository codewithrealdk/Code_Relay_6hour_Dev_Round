const Leave = require("../models/Leave");

async function getAllLeaves(req, res) {
  try {
    const leaves = await Leave.find().populate("userId", "name role");
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { getAllLeaves };