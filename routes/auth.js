import * as authService from "../services/authService.js";
import config from "../config/index.js";

export default async function authRoutes(fastify) {
  // POST /api/auth/login — returns JWT
  fastify.post("/api/auth/login", async (request, reply) => {
    const { username, password } = request.body || {};
    if (!username || !password) {
      return reply
        .status(400)
        .send({ error: "Foydalanuvchi nomi va parol kiritilishi shart" });
    }

    const result = await authService.authenticate(username, password);
    if (!result) {
      return reply
        .status(401)
        .send({ error: "Noto'g'ri foydalanuvchi nomi yoki parol" });
    }

    return reply.send(result);
  });

  // POST /api/auth/create-admin — register super admin (requires regKey === JWT_SECRET)
  fastify.post("/api/auth/create-admin", async (request, reply) => {
    const { regKey, username, password, fullName } = request.body || {};
    console.log(
      "Received create-admin request with regKey:",
      regKey,
      "and config.jwtSecret:",
      config.jwtSecret
    );
    if (!regKey || regKey !== config.jwtSecret) {
      return reply
        .status(403)
        .send({ error: "Ro'yxatdan o'tish kaliti noto'g'ri" });
    }

    if (!username || !password) {
      return reply
        .status(400)
        .send({ error: "Foydalanuvchi nomi va parol kiritilishi shart" });
    }

    try {
      const result = await authService.createAdmin({
        username,
        password,
        fullName,
      });
      return reply.status(201).send(result);
    } catch (err) {
      return reply.status(409).send({ error: err.message });
    }
  });

  // GET /api/auth/me — validate token, return user
  fastify.get("/api/auth/me", {
    preHandler: [fastify.authenticate],
    handler: async (request, reply) => {
      return reply.send({ user: request.user });
    },
  });
}
