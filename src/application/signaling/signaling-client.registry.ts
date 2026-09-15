import WebSocket from "ws";

export interface SignalingClient {
    socket: WebSocket;
    mediaSessionId: string;
    participantId: string;
}

export class SignalingClientRegistry {
    private readonly clients = new Set<SignalingClient>();

    add(client: SignalingClient): void {
        this.clients.add(client);
    }
    
    close(): void {
        for (const client of this.clients) {
            client.socket.close();
        }

        this.clients.clear();
    }

    getClientsForSession(mediaSessionId: string): SignalingClient[] {
        const clients: SignalingClient[] = [];

        for (const client of this.clients) {
            if (client.mediaSessionId === mediaSessionId) {
                clients.push(client);
            }
        }

        return clients;
    }

    getClient(socket: WebSocket): SignalingClient | undefined {
        for (const client of this.clients) {
            if (client.socket === socket) {
                return client;
            }
        }

        return undefined;
    }

    remove(client: SignalingClient): void {
        this.clients.delete(client);
    }
}