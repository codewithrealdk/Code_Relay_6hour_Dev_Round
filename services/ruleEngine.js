function evaluateLeave(workload, conflict) {

  let impactScore = 0;

  if (conflict) impactScore += 50;
  if (workload > 70) impactScore += 30;
  else if (workload >= 40) impactScore += 20;

  let status;
  let decisionReason;

  if (conflict) {
    status = "Rejected";
    decisionReason = "Deadline conflict during leave period";
  } 
  else if (workload < 40) {
    status = "Auto Approved";
    decisionReason = "Low workload";
  } 
  else {
    status = "Escalated";
    decisionReason = "Moderate workload - Manager review required";
  }

  return { status, decisionReason, impactScore };
}

module.exports = { evaluateLeave };