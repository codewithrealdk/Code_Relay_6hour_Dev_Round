const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const connectDB = require("./config/db");

connectDB();

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.listen(3000, () => {
  console.log("Server running on port 3000");
});

const { applyLeave } = require("./controllers/leaveController");

app.post("/apply-leave", applyLeave);

const { createUser } = require("./controllers/userController");
const { createTask } = require("./controllers/taskController");

app.post("/create-user", createUser);
app.post("/create-task", createTask);
app.post("/apply-leave", applyLeave);
const path = require("path");
app.use(express.static(path.join(__dirname, "public")));