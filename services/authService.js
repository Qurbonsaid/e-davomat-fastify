import jwt from "jsonwebtoken";
import config from "../config/index.js";
import { User } from "../models/index.js";

export function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      role: user.role,
    },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

export function verifyToken(token) {
  return jwt.verify(token, config.jwtSecret);
}

export async function authenticate(username, password) {
  const user = await User.findOne({ username }).select("+password");
  if (!user) return null;

  const valid = await user.comparePassword(password);
  if (!valid) return null;

  const token = signToken(user);
  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    },
  };
}

export async function createAdmin({ username, password, fullName }) {
  const existing = await User.findOne({ username });
  if (existing) throw new Error("Bu foydalanuvchi nomi allaqachon band");

  const user = new User({
    username,
    password,
    fullName: fullName || username,
    role: "superadmin",
  });
  await user.save();

  const token = signToken(user);
  return {
    token,
    user: {
      id: user._id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
    },
  };
}

export async function getUserFromToken(payload) {
  return User.findById(payload.id).lean();
}
