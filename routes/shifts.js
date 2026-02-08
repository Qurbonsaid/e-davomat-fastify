import * as svc from "../services/employeeService.js";

export default async function shiftRoutes(fastify) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/api/shifts", async (_, reply) => {
    return reply.send(await svc.getShifts());
  });

  fastify.get("/api/shifts/:id", async (request, reply) => {
    const shift = await svc.getShiftById(request.params.id);
    if (!shift) return reply.status(404).send({ error: "Smena topilmadi" });
    return reply.send(shift);
  });

  fastify.post("/api/shifts", async (request, reply) => {
    const shift = await svc.createShift(request.body);
    return reply.status(201).send(shift);
  });

  fastify.put("/api/shifts/:id", async (request, reply) => {
    const shift = await svc.updateShift(request.params.id, request.body);
    if (!shift) return reply.status(404).send({ error: "Smena topilmadi" });
    return reply.send(shift);
  });

  fastify.delete("/api/shifts/:id", async (request, reply) => {
    const result = await svc.deleteShift(request.params.id);
    if (!result) return reply.status(404).send({ error: "Smena topilmadi" });
    return reply.send({ success: true });
  });
}
