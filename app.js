import Fastify from "fastify";
import { existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

import config from "./config/index.js";
import { connectDB } from "./config/database.js";

// Plugins
import corePlugins from "./plugins/core.js";
import authPlugin from "./plugins/auth.js";

// Routes
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import employeeRoutes from "./routes/employees.js";
import attendanceRoutes from "./routes/attendance.js";
import shiftRoutes from "./routes/shifts.js";
import branchRoutes from "./routes/branches.js";
import departmentRoutes from "./routes/departments.js";
import positionRoutes from "./routes/positions.js";
import deviceRoutes from "./routes/devices.js";
import reportRoutes from "./routes/reports.js";
import hikvisionRoutes from "./routes/hikvision.js";
import wsRoutes from "./routes/ws.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function build() {
  const fastify = Fastify({ logger: true });

  // Core plugins (cors, formbody, websocket, static)
  await fastify.register(corePlugins);

  // Auth decorator
  await fastify.register(authPlugin);

  // Routes
  await fastify.register(authRoutes);
  await fastify.register(wsRoutes);
  await fastify.register(hikvisionRoutes);
  await fastify.register(dashboardRoutes);
  await fastify.register(employeeRoutes);
  await fastify.register(attendanceRoutes);
  await fastify.register(shiftRoutes);
  await fastify.register(branchRoutes);
  await fastify.register(departmentRoutes);
  await fastify.register(positionRoutes);
  await fastify.register(deviceRoutes);
  await fastify.register(reportRoutes);

  // Health check
  fastify.get("/api/health", async () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }));

  return fastify;
}

async function start() {
  const fastify = await build();

  // Ensure uploads dir
  const uploadsDir = join(__dirname, "uploads");
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

  // Connect DB
  await connectDB();

  // Listen
  await fastify.listen({ port: config.port, host: config.host });
  console.log(`🚀 Server running on http://${config.host}:${config.port}`);
  console.log(
    `📡 Hikvision webhook: http://${config.host}:${config.port}/api/hikvision/event`
  );
  console.log(`🔌 WebSocket: ws://${config.host}:${config.port}/ws`);
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
