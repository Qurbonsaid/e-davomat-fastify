/**
 * Seed initial data into the database.
 *
 * Usage:
 *   node scripts/seed.js
 *
 * Creates default branch, department, position, and shift if empty.
 * Does NOT create users — use POST /api/auth/create-admin for that.
 */
import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import config from "../config/index.js";
import {
  Branch,
  Department,
  Position,
  Shift,
} from "../models/index.js";

async function seed() {
  await mongoose.connect(config.mongoUri);
  console.log("✅ Connected to MongoDB");

  const branchCount = await Branch.countDocuments();
  if (branchCount > 0) {
    console.log("⏭  Database already has data — skipping seed.");
    process.exit(0);
  }

  console.log("📦 Seeding default data...");

  const branch = await Branch.create({
    name: "Main Office",
    address: "123 Main Street",
  });

  await Department.create({ branch: branch._id, name: "General" });
  await Position.create({ name: "Employee" });

  await Shift.create({
    name: "Morning Shift",
    startTime: "09:00",
    endTime: "18:00",
    gracePeriodMinutes: 15,
    breakStart: "13:00",
    breakEnd: "14:00",
    workDays: [
      { dayOfWeek: 0, isWorkingDay: false },
      { dayOfWeek: 1, isWorkingDay: true },
      { dayOfWeek: 2, isWorkingDay: true },
      { dayOfWeek: 3, isWorkingDay: true },
      { dayOfWeek: 4, isWorkingDay: true },
      { dayOfWeek: 5, isWorkingDay: true },
      { dayOfWeek: 6, isWorkingDay: false },
    ],
  });

  console.log("✅ Seed complete");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
