import { WebSocket, WebSocketServer } from "ws";
import { ConsumeHandler } from "./consume.handler.js";
import { GetRtpCapabilitiesHandler } from "./get-rtp-capabilities.handler.js";
import { CreateTransportHandler } from "./create-transport.handler.js";
import { ConnectTransportHandler } from "./connect-transport.handler.js";
import { ProduceHandler } from "./produce.handler.js";
import { GetProducersHandler } from "./get-producers.handler.js";
import { ResumeConsumerHandler } from "./resume-consumer.handler.js";
import { SignalingClient, SignalingClientRegistry } from "./signaling-client.registry.js";
import { JoinSignalingRequest } from "./join-signaling.types.js";
import { SignalingAuthenticator } from "./signaling-authenticator.js";
import { JoinSignalingHandler } from "./join-signaling.handler.js";

interface RoomDependencies {
    readonly consumeHandler: ConsumeHandler;
    readonly produceHandler: ProduceHandler;
    readonly getRtpCapabilitiesHandler: GetRtpCapabilitiesHandler;
    readonly createTransportHandler: CreateTransportHandler;
    readonly connectTransportHandler: ConnectTransportHandler;
    readonly getProducersHandler: GetProducersHandler;
    readonly resumeConsumerHandler: ResumeConsumerHandler;
    readonly signalingAuthenticator: SignalingAuthenticator;
    readonly joinSignalingHandler: JoinSignalingHandler;
}

export class WebSocketSignalingServer {
    private readonly server: WebSocketServer;
    private readonly clientRegistry = new SignalingClientRegistry();

    private readonly port: number;

    constructor(
        private readonly p: RoomDependencies,
        port: number,
    ) {
        this.port = port;
        this.server = new WebSocketServer({
            port,
        });
    }

    start(): void {
        this.server.on("connection", (socket: WebSocket) => {
            console.log("[WebSocket] Client connected");

            let signalingClient: SignalingClient | undefined;

            socket.on("message", async (message) => {
                await this.handleMessage(
                    socket,
                    message.toString(),
                    (client) => {
                        signalingClient = client;
                    },
                );
            });

            socket.on("close", () => {
                console.log("[WebSocket] Client disconnected");

                if (signalingClient) {
                    this.clientRegistry.remove(signalingClient);
                }
            });

            socket.on("error", (error) => {
                console.error("[WebSocket] Client error", error);
            });
        });

        console.log(`[WebSocket] Signaling server started on port ${this.port}`);
    }

    private async handleMessage(
        socket: WebSocket,
        message: string,
        onClientJoined: (
            client: SignalingClient,
        ) => void,
    ): Promise<void> {
        try {
            const request = JSON.parse(message);

            if (request.type === "consume") {
                const client = this.getAuthenticatedClient(socket);

                this.authorizeRequest(
                    client,
                    request.data.mediaSessionId,
                    request.data.participantId
                );

                const response = await this.p.consumeHandler.handle({
                    mediaSessionId: client.mediaSessionId,
                    participantId: client.participantId,
                    producerId: request.data.producerId,
                    rtpCapabilities:  request.data.rtpCapabilities,
                });

                socket.send(
                    JSON.stringify({
                        type: "consume-success",
                        data: response,
                    }),
                );

                return;
            }

            if (request.type === 'get-rtp-capabilities') {
                const client = this.getAuthenticatedClient(socket);

                this.authorizeRequest(
                    client, 
                    request.data.mediaSessionId,
                    client.participantId,
                );
                
                const response = this.p.getRtpCapabilitiesHandler.handle(
                    {
                        mediaSessionId: client.mediaSessionId    
                    }
                );

                socket.send(
                    JSON.stringify({
                        type: 'get-rtp-capabilities-success',
                        data: response,
                    }),
                );

                return;
            }

            if (request.type === 'create-transport') {
                const client = this.getAuthenticatedClient(socket);

                this.authorizeRequest(
                    client,
                    request.data.mediaSessionId,
                    request.data.participantId,
                );

                const response = await this.p.createTransportHandler.handle({
                    mediaSessionId: client.mediaSessionId,
                    participantId: client.participantId,
                    direction: request.data.direction,
                });

                socket.send(
                    JSON.stringify({
                        type: 'create-transport-success',
                        data: response,
                    }),
                );

                return;
            }

            if (request.type === 'connect-transport') {
                const client = this.getAuthenticatedClient(socket);

                this.authorizeRequest(
                    client,
                    request.data.mediaSessionId,
                    request.data.participantId,
                );

                const response = await this.p.connectTransportHandler.handle({
                    mediaSessionId: client.mediaSessionId,
                    participantId: client.participantId,
                    direction: request.data.direction,
                    dtlsParameters: request.data.dtlsParameters,
                });

                socket.send(
                    JSON.stringify({
                        type: 'connect-transport-success',
                        data: response,
                    }),
                );

                return;
            }

            if (request.type === 'produce') {
                const client = this.getAuthenticatedClient(socket);

                this.authorizeRequest(
                    client,
                    request.data.mediaSessionId,
                    request.data.participantId,
                );

                const response = await this.p.produceHandler.handle({
                    mediaSessionId: client.mediaSessionId,
                    participantId: client.participantId,
                    kind: request.data.kind,
                    rtpParameters: request.data.rtpParameters,
                });

                const clients = this.clientRegistry.getClientsForSession(request.data.mediaSessionId);

                for (const specClient of clients) {
                    if (specClient.participantId === client.participantId) {
                        continue;
                    }

                    if (specClient.socket.readyState !== WebSocket.OPEN) {
                        continue;
                    }

                    specClient.socket.send(
                        JSON.stringify({
                            type: 'new-producer',
                            data: {
                                producerId: response.id,
                                participantId: client.participantId,
                                kind: response.kind,
                            },
                        }),
                    );
                }

                socket.send(
                    JSON.stringify({
                        type: 'produce-success',
                        data: response,
                    }),
                );

                return;
            }

            if (request.type === 'get-producers') {
                const client = this.getAuthenticatedClient(socket);

                this.authorizeRequest(
                    client,
                    request.data.mediaSessionId,
                    request.data.participantId,
                );

                const response = this.p.getProducersHandler.handle({
                    mediaSessionId: client.mediaSessionId,
                    participantId:  client.participantId,
                });

                socket.send(
                    JSON.stringify({
                        type: 'get-producers-success',
                        data: response,
                    }),
                );

                return;
            }

            if (request.type === 'resume-consumer') {
                const client = this.getAuthenticatedClient(socket);

                this.authorizeRequest(
                    client,
                    request.data.mediaSessionId,
                    request.data.participantId,
                );

                const response = this.p.resumeConsumerHandler.handle({
                    mediaSessionId: client.mediaSessionId,
                    participantId: client.participantId,
                    consumerId: request.data.consumerId,
                });

                socket.send(
                    JSON.stringify({
                        type: 'resume-consumer-success',
                        data: response,
                    }),
                );

                return;
            }

            if (request.type === 'join-signaling') {
                const joinRequest = request.data as JoinSignalingRequest;

                const authenticated = this.p.signalingAuthenticator.authenticate(
                    joinRequest.token,
                );

                this.p.joinSignalingHandler.handle({
                    mediaSessionId: authenticated.mediaSessionId,
                    participantId: authenticated.participantId,
                });

                const client: SignalingClient = {
                    socket,
                    mediaSessionId: authenticated.mediaSessionId,
                    participantId: authenticated.participantId,
                };

                this.clientRegistry.add(client);

                onClientJoined(client);

                socket.send(
                    JSON.stringify({
                        type: 'join-signaling-success',
                        data: {
                            mediaSessionId:
                                authenticated.mediaSessionId,
                            participantId:
                                authenticated.participantId,
                        },
                    }),
                );

                return;
            }

            socket.send(
                JSON.stringify({
                    type: "error",
                    error: {
                        message: `Unknown signaling message type: ${request.type}`,
                    },
                }),
            );
        } catch (error) {
            console.error("[WebSocket] Signaling error", error);

            socket.send(
                JSON.stringify({
                    type: "error",
                    error: {
                        message:
                        error instanceof Error
                            ? error.message
                            : "Unknown signaling error",
                    },
                }),
            );
        }
    }

    close(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.server.close((error) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve();
            });
        });
    }

    private getAuthenticatedClient(socket: WebSocket): SignalingClient {
        const client = this.clientRegistry.getClient(socket);

        if (!client) {
            throw new Error(
                'Signaling client is not authenticated',
            );
        }

        return client;
    }

    private authorizeRequest(
        client: SignalingClient,
        mediaSessionId: string,
        participantId: string,
    ): void {
        if (client.mediaSessionId !== mediaSessionId) {
            throw new Error(
                'MediaSession is not authorized for this signaling connection',
            );
        }

        if (client.participantId !== participantId) {
            throw new Error(
                'Participant is not authorized for this signaling connection',
            );
        }
    }
}
