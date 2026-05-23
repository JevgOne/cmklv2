/**
 * Server-side SSE connection manager.
 *
 * Maintains a map of active SSE connections per userId + per role.
 * Used by workflow notifications to push real-time events to connected clients.
 */

interface SSEClient {
  controller: ReadableStreamDefaultController;
  userId: string;
  role: string;
}

class SSEManager {
  private clients = new Map<string, Set<SSEClient>>();
  private roleClients = new Map<string, Set<SSEClient>>();

  addClient(userId: string, role: string, controller: ReadableStreamDefaultController): SSEClient {
    const client: SSEClient = { controller, userId, role };

    // Per-user map
    if (!this.clients.has(userId)) {
      this.clients.set(userId, new Set());
    }
    this.clients.get(userId)!.add(client);

    // Per-role map
    if (!this.roleClients.has(role)) {
      this.roleClients.set(role, new Set());
    }
    this.roleClients.get(role)!.add(client);

    return client;
  }

  removeClient(client: SSEClient): void {
    const userSet = this.clients.get(client.userId);
    if (userSet) {
      userSet.delete(client);
      if (userSet.size === 0) this.clients.delete(client.userId);
    }

    const roleSet = this.roleClients.get(client.role);
    if (roleSet) {
      roleSet.delete(client);
      if (roleSet.size === 0) this.roleClients.delete(client.role);
    }
  }

  sendToUser(userId: string, event: string, data: unknown): void {
    const clients = this.clients.get(userId);
    if (!clients) return;

    const message = formatSSE(event, data);
    for (const client of clients) {
      try {
        client.controller.enqueue(new TextEncoder().encode(message));
      } catch {
        this.removeClient(client);
      }
    }
  }

  sendToRole(role: string, event: string, data: unknown): void {
    const clients = this.roleClients.get(role);
    if (!clients) return;

    const message = formatSSE(event, data);
    for (const client of clients) {
      try {
        client.controller.enqueue(new TextEncoder().encode(message));
      } catch {
        this.removeClient(client);
      }
    }
  }

  sendToAll(event: string, data: unknown): void {
    const message = formatSSE(event, data);
    for (const [, clients] of this.clients) {
      for (const client of clients) {
        try {
          client.controller.enqueue(new TextEncoder().encode(message));
        } catch {
          this.removeClient(client);
        }
      }
    }
  }

  get connectionCount(): number {
    let total = 0;
    for (const [, clients] of this.clients) {
      total += clients.size;
    }
    return total;
  }
}

function formatSSE(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

// Singleton — survives across requests in the same Node process
// (globalThis to persist across hot-reloads in dev)
const globalForSSE = globalThis as unknown as { sseManager?: SSEManager };
export const sseManager = globalForSSE.sseManager ?? new SSEManager();
if (process.env.NODE_ENV !== "production") {
  globalForSSE.sseManager = sseManager;
}
