import fp from "fastify-plugin";
import cors from "@fastify/cors";
import formbody from "@fastify/formbody";
import websocket from "@fastify/websocket";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function corePlugins(fastify) {
  const allowedOrigins = [
    process.env.FRONTEND_URL || "http://localhost:5173",
    "https://davomat.vercel.app",
  ];
  await fastify.register(cors, {
    origin: (origin, cb) => {
      if (!origin || allowedOrigins.includes(origin)) {
        cb(null, true);
      } else {
        cb(null, false);
      }
    },
    credentials: true,
  });
  await fastify.register(formbody);
  await fastify.register(websocket);
  await fastify.register(fastifyStatic, {
    root: join(__dirname, "..", "uploads"),
    prefix: "/uploads/",
  });
}

export default fp(corePlugins, { name: "core" });
