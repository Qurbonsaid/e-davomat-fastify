import mongoose from "mongoose";

const employeeSchema = new mongoose.Schema(
  {
    deviceId: { type: String, required: true, unique: true, index: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    photoUrl: { type: String },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    department: { type: mongoose.Schema.Types.ObjectId, ref: "Department" },
    position: { type: mongoose.Schema.Types.ObjectId, ref: "Position" },
    shift: { type: mongoose.Schema.Types.ObjectId, ref: "Shift" },
    hireDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "inactive", "terminated"],
      default: "active",
    },
  },
  { timestamps: true }
);

export default mongoose.model("Employee", employeeSchema);
