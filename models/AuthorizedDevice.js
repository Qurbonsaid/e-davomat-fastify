import mongoose from "mongoose";

const authorizedDeviceSchema = new mongoose.Schema(
  {
    serialNumber: { type: String, required: true, unique: true },
    name: { type: String },
    ipAddress: { type: String },
    branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export default mongoose.model("AuthorizedDevice", authorizedDeviceSchema);
