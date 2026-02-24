const Task = require("../models/Task");

async function analyzeWorkload(userId, startDate, endDate) {

  const tasks = await Task.find({
    assignedTo: userId,
    status: "Pending"
  });

  const activeTasks = tasks.length;
  const maxCapacity = 5;   // For hackathon demo

  const workloadPercentage = (activeTasks / maxCapacity) * 100;

  let deadlineConflict = false;

  tasks.forEach(task => {
    if (
      new Date(task.deadline) >= new Date(startDate) &&
      new Date(task.deadline) <= new Date(endDate)
    ) {
      deadlineConflict = true;
    }
  });

  return { workloadPercentage, deadlineConflict };
}

module.exports = { analyzeWorkload };