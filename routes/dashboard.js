import * as svc from "../services/employeeService.js";

export default async function dashboardRoutes(fastify) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/api/dashboard/stats", async (request, reply) => {
    const date = request.query.date || new Date().toISOString().split("T")[0];
    const stats = await svc.getTodayStats(new Date(date));
    return reply.send(stats);
  });

  fastify.get("/api/dashboard/recent", async (request, reply) => {
    const limit = parseInt(request.query.limit) || 20;
    const logs = await svc.getAttendanceLogs({ limit });
    return reply.send(logs);
  });
}
