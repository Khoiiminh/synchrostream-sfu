import { MediaSessionRuntimeManager } from "../../infrastructure/mediasoup/media-session-runtime.manager.js";
import { ConnectTransportRequest, ConnectTransportResponse } from "./transport.types.js";

export class ConnectTransportHandler {
    constructor(
        private readonly mediaSessionRuntimeManager:
            MediaSessionRuntimeManager,
    ) {}

    async handle(request: ConnectTransportRequest): Promise<ConnectTransportResponse> {
        const session = this.mediaSessionRuntimeManager.getAssigned(request.mediaSessionId);

        session.assertActive();

        const participant = session.getParticipant(
            request.participantId,
        );

        if (!participant) {
            throw new Error(
                `Participant not found: ${request.participantId}`,
            );
        }

        if (request.direction === 'send') {
            await participant.connectSendTransport(
                request.dtlsParameters,
            );
        } else {
            await participant.connectReceiveTransport(
                request.dtlsParameters,
            );
        }

        return {
            direction: request.direction,
        };
    }
}