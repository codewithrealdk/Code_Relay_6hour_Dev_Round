const Task = require("../models/Task");

async function createTask(req, res) {
  try {
    const { assignedTo, title, deadline } = req.body;

    const task = await Task.create({
      assignedTo,
      title,
      deadline
    });

    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { createTask };