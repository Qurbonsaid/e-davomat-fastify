// WebSocket connection manager (singleton)
const connections = new Set();

export function addConnection(socket) {
  connections.add(socket);
}

export function removeConnection(socket) {
  connections.delete(socket);
}

export function broadcast(data) {
  const message = JSON.stringify(data);
  for (const ws of connections) {
    if (ws.readyState === 1) {
      ws.send(message);
    }
  }
}

export function getConnectionCount() {
  return connections.size;
}
