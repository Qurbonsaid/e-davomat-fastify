import mongoose from "mongoose";

const shiftSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    gracePeriodMinutes: { type: Number, default: 15 },
    breakStart: { type: String },
    breakEnd: { type: String },
    workDays: [
      {
        dayOfWeek: { type: Number, min: 0, max: 6 },
        isWorkingDay: { type: Boolean, default: true },
      },
    ],
  },
  { timestamps: true }
);

export default mongoose.model("Shift", shiftSchema);
