import dotenv from "dotenv";
dotenv.config();

const config = {
  port: parseInt(process.env.PORT) || 8085,
  host: process.env.HOST || "0.0.0.0",
  mongoUri: process.env.MONGODB_URI || "mongodb://localhost:27017/e-davomat",
  jwtSecret: process.env.JWT_SECRET || "change-me-in-production",
  regKey: process.env.REG_KEY || "super-secret-registration-key",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  uploadsDir: "uploads",
};

export default config;
