import * as svc from "../services/employeeService.js";

export default async function attendanceRoutes(fastify) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/api/attendance", async (request, reply) => {
    const filters = {
      employee_id: request.query.employee_id,
      date: request.query.date,
      start_date: request.query.start_date,
      end_date: request.query.end_date,
      status: request.query.status,
      limit: request.query.limit ? parseInt(request.query.limit) : undefined,
    };
    return reply.send(await svc.getAttendanceLogs(filters));
  });
}
