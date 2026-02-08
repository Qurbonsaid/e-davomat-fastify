import * as svc from "../services/employeeService.js";

export default async function positionRoutes(fastify) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/api/positions", async (_, reply) => {
    return reply.send(await svc.getPositions());
  });

  fastify.post("/api/positions", async (request, reply) => {
    const pos = await svc.createPosition(request.body);
    return reply.status(201).send(pos);
  });

  fastify.put("/api/positions/:id", async (request, reply) => {
    const pos = await svc.updatePosition(request.params.id, request.body);
    if (!pos) return reply.status(404).send({ error: "Lavozim topilmadi" });
    return reply.send(pos);
  });

  fastify.delete("/api/positions/:id", async (request, reply) => {
    const result = await svc.deletePosition(request.params.id);
    if (!result) return reply.status(404).send({ error: "Lavozim topilmadi" });
    return reply.send({ success: true });
  });
}
