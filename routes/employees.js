import * as svc from "../services/employeeService.js";

export default async function employeeRoutes(fastify) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/api/employees", async (request, reply) => {
    const filters = {
      branch_id: request.query.branch_id,
      department_id: request.query.department_id,
      status: request.query.status,
      search: request.query.search,
    };
    return reply.send(await svc.getEmployees(filters));
  });

  fastify.get("/api/employees/:id", async (request, reply) => {
    const employee = await svc.getEmployeeById(request.params.id);
    if (!employee) return reply.status(404).send({ error: "Xodim topilmadi" });
    return reply.send(employee);
  });

  fastify.post("/api/employees", async (request, reply) => {
    try {
      const employee = await svc.createEmployee(request.body);
      return reply.status(201).send(employee);
    } catch (err) {
      if (err.code === 11000) {
        return reply.status(400).send({ error: "Bu qurilma ID allaqachon mavjud" });
      }
      throw err;
    }
  });

  fastify.put("/api/employees/:id", async (request, reply) => {
    const employee = await svc.updateEmployee(request.params.id, request.body);
    if (!employee) return reply.status(404).send({ error: "Xodim topilmadi" });
    return reply.send(employee);
  });

  fastify.delete("/api/employees/:id", async (request, reply) => {
    const ok = await svc.deleteEmployee(request.params.id);
    if (!ok) return reply.status(404).send({ error: "Xodim topilmadi" });
    return reply.send({ success: true });
  });

  fastify.get("/api/employees/:id/attendance", async (request, reply) => {
    const now = new Date();
    const y = parseInt(request.query.year) || now.getFullYear();
    const m = parseInt(request.query.month) || now.getMonth() + 1;
    const data = await svc.getEmployeeAttendanceForMonth(
      request.params.id,
      y,
      m
    );
    return reply.send(data);
  });
}
