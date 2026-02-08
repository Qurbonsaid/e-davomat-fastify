import mongoose from "mongoose";

const attendanceLogSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Employee",
      required: true,
      index: true,
    },
    deviceId: { type: String, required: true, index: true },
    deviceSerial: { type: String },
    eventTime: { type: Date, required: true, index: true },
    direction: { type: String, enum: ["in", "out"], default: "in" },
    status: {
      type: String,
      enum: ["on_time", "late", "early"],
      default: "on_time",
    },
    lateMinutes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("AttendanceLog", attendanceLogSchema);
