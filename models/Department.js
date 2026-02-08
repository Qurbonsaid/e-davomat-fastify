import mongoose from "mongoose";

const departmentSchema = new mongoose.Schema(
  {
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("Department", departmentSchema);
