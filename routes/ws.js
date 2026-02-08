import { addConnection, removeConnection } from "../services/wsService.js";

export default async function wsRoutes(fastify) {
  fastify.get("/ws", { websocket: true }, (socket) => {
    fastify.log.info("🔌 WebSocket client connected");
    addConnection(socket);

    socket.on("message", (msg) => {
      try {
        const data = JSON.parse(msg.toString());
        if (data.type === "ping") {
          socket.send(JSON.stringify({ type: "pong" }));
        }
      } catch {
        // ignore
      }
    });

    socket.on("close", () => {
      fastify.log.info("🔌 WebSocket client disconnected");
      removeConnection(socket);
    });

    socket.on("error", () => removeConnection(socket));

    socket.send(
      JSON.stringify({ type: "connected", timestamp: new Date().toISOString() })
    );
  });
}
