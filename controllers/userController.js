const User = require("../models/User");

async function createUser(req, res) {
  try {
    const { name, role } = req.body;

    const user = await User.create({ name, role });

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

module.exports = { createUser };