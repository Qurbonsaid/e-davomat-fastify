import fp from "fastify-plugin";
import { verifyToken } from "../services/authService.js";
import { User } from "../models/index.js";

/**
 * JWT Bearer authentication plugin.
 * Decorates `fastify.authenticate` as a preHandler.
 */
async function authPlugin(fastify) {
  fastify.decorate("authenticate", async (request, reply) => {
    const header = request.headers.authorization;
    if (!header || !header.startsWith("Bearer ")) {
      return reply.status(401).send({ error: "Token topilmadi yoki noto'g'ri" });
    }

    try {
      const token = header.slice(7);
      const payload = verifyToken(token);
      const user = await User.findById(payload.id).lean();
      if (!user) {
        return reply.status(401).send({ error: "Foydalanuvchi topilmadi" });
      }
      request.user = {
        id: user._id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
      };
    } catch (err) {
      return reply.status(401).send({ error: "Token noto'g'ri yoki muddati tugagan" });
    }
  });
}

export default fp(authPlugin, { name: "auth" });
