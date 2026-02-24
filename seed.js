const mongoose = require("mongoose");
const connectDB = require("./config/db");

const User = require("./models/User");
const Task = require("./models/Task");
const Leave = require("./models/Leave");

async function seedData() {
    try {
        await connectDB();

        console.log("Connected to DB...");

        // Clear old data
        await User.deleteMany();
        await Task.deleteMany();
        await Leave.deleteMany();

        console.log("Old data cleared.");

        // Create Employee
        const employee = await User.create({
            name: "Rahul Sharma",
            role: "employee"
        });

        // Create Manager
        const manager = await User.create({
            name: "Amit Verma",
            role: "manager"
        });

        console.log("Users created.");

        // Create Tasks for Employee
        await Task.create([
            {
                assignedTo: employee._id,
                title: "Complete Module A",
                deadline: new Date("2026-02-24"),
                status: "Pending"
            },
            {
                assignedTo: employee._id,
                title: "Database Optimization",
                deadline: new Date("2026-02-28"),
                status: "Pending"
            },
            {
                assignedTo: employee._id,
                title: "Client Report",
                deadline: new Date("2026-03-02"),
                status: "Pending"
            }
        ]);

        console.log("Tasks created.");

        console.log("\n==== SEEDING COMPLETE ====");
        console.log("Employee ID:", employee._id);
        console.log("Manager ID:", manager._id);

        process.exit();
    } catch (error) {
        console.error("Error seeding data:", error);
        process.exit(1);
    }
}

seedData();