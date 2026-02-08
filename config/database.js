import mongoose from "mongoose";
import config from "./index.js";

export async function connectDB() {
  try {
    await mongoose.connect(config.mongoUri);
    console.log("✅ Connected to MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error);
    process.exit(1);
  }
}
