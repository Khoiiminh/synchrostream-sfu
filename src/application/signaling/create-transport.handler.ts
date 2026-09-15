import { MediaSessionRuntimeManager } from "../../infrastructure/mediasoup/media-session-runtime.manager.js";
import { CreateTransportRequest, CreateTransportResponse } from "./transport.types.js";

export class CreateTransportHandler {
    constructor(
        private readonly mediaSessionRuntimeManager:
            MediaSessionRuntimeManager,
    ) {}

    async handle(
        request: CreateTransportRequest,
    ): Promise<CreateTransportResponse> {
        const session = this.mediaSessionRuntimeManager.getAssigned(request.mediaSessionId);

        session.assertActive();

        const participant = session.getParticipant(request.participantId);

        if (!participant) {
            throw new Error(
                `Participant not found: ${request.participantId}`,
            );
        }

        let transport;

        if (request.direction === 'send') {
            transport =
                await participant.createSendTransport(
                    session.getRouter(),
                    session.getWebRtcServer(),
                );
        } else {
            transport =
                await participant.createReceiveTransport(
                    session.getRouter(),
                    session.getWebRtcServer(),
                );
        }

        return {
            direction: request.direction,
            transport:
                participant.getTransportOptions(
                    transport,
                ),
        };
    }
}