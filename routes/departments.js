import * as svc from "../services/employeeService.js";

export default async function departmentRoutes(fastify) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/api/departments", async (request, reply) => {
    const branchId = request.query.branch_id || null;
    return reply.send(await svc.getDepartments(branchId));
  });

  fastify.post("/api/departments", async (request, reply) => {
    const dep = await svc.createDepartment(request.body);
    return reply.status(201).send(dep);
  });

  fastify.put("/api/departments/:id", async (request, reply) => {
    const dep = await svc.updateDepartment(request.params.id, request.body);
    if (!dep) return reply.status(404).send({ error: "Bo'lim topilmadi" });
    return reply.send(dep);
  });

  fastify.delete("/api/departments/:id", async (request, reply) => {
    const result = await svc.deleteDepartment(request.params.id);
    if (!result)
      return reply.status(404).send({ error: "Bo'lim topilmadi" });
    return reply.send({ success: true });
  });
}
