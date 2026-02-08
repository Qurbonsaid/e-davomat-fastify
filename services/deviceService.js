import { AuthorizedDevice } from "../models/index.js";

export async function getDevices() {
  return AuthorizedDevice.find()
    .populate("branch", "name")
    .sort({ name: 1 })
    .lean();
}

export async function getDeviceById(id) {
  return AuthorizedDevice.findById(id)
    .populate("branch", "name")
    .lean();
}

export async function isDeviceAuthorized(serialNumber) {
  const device = await AuthorizedDevice.findOne({
    serialNumber,
    isActive: true,
  });
  return !!device;
}

export async function createDevice(data) {
  const device = new AuthorizedDevice({
    serialNumber: data.serialNumber,
    name: data.name,
    ipAddress: data.ipAddress,
    branch: data.branch || undefined,
    isActive: data.isActive !== undefined ? data.isActive : true,
  });
  await device.save();
  return device;
}

export async function updateDevice(id, data) {
  const update = {};
  if (data.serialNumber !== undefined) update.serialNumber = data.serialNumber;
  if (data.name !== undefined) update.name = data.name;
  if (data.ipAddress !== undefined) update.ipAddress = data.ipAddress;
  if (data.branch !== undefined) update.branch = data.branch;
  if (data.isActive !== undefined) update.isActive = data.isActive;

  return AuthorizedDevice.findByIdAndUpdate(id, update, { new: true })
    .populate("branch", "name")
    .lean();
}

export async function deleteDevice(id) {
  return AuthorizedDevice.findByIdAndDelete(id);
}
