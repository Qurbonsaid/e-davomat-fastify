import * as svc from "../services/deviceService.js";

export default async function deviceRoutes(fastify) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/api/devices", async (_, reply) => {
    return reply.send(await svc.getDevices());
  });

  fastify.post("/api/devices", async (request, reply) => {
    const device = await svc.createDevice(request.body);
    return reply.status(201).send(device);
  });

  fastify.put("/api/devices/:id", async (request, reply) => {
    const device = await svc.updateDevice(request.params.id, request.body);
    if (!device) return reply.status(404).send({ error: "Qurilma topilmadi" });
    return reply.send(device);
  });

  fastify.delete("/api/devices/:id", async (request, reply) => {
    const result = await svc.deleteDevice(request.params.id);
    if (!result) return reply.status(404).send({ error: "Qurilma topilmadi" });
    return reply.send({ success: true });
  });
}
