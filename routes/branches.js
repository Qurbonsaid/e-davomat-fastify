import * as svc from "../services/employeeService.js";

export default async function branchRoutes(fastify) {
  fastify.addHook("preHandler", fastify.authenticate);

  fastify.get("/api/branches", async (_, reply) => {
    return reply.send(await svc.getBranches());
  });

  fastify.post("/api/branches", async (request, reply) => {
    const branch = await svc.createBranch(request.body);
    return reply.status(201).send(branch);
  });

  fastify.put("/api/branches/:id", async (request, reply) => {
    const branch = await svc.updateBranch(request.params.id, request.body);
    if (!branch) return reply.status(404).send({ error: "Filial topilmadi" });
    return reply.send(branch);
  });

  fastify.delete("/api/branches/:id", async (request, reply) => {
    const result = await svc.deleteBranch(request.params.id);
    if (!result) return reply.status(404).send({ error: "Filial topilmadi" });
    return reply.send({ success: true });
  });
}
