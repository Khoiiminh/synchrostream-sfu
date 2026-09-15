import { MediaSessionRuntimeManager } from "../../infrastructure/mediasoup/media-session-runtime.manager.js";
import { ProduceRequest, ProduceResponse } from "./produce.types.js";

export class ProduceHandler {
    constructor(
        private readonly mediaSessionRuntimeManager:
            MediaSessionRuntimeManager,
    ) {}

    async handle(
        request: ProduceRequest,
    ): Promise<ProduceResponse> {
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

        const producer = await participant.createProducer(
            request.kind,
            request.rtpParameters,
        );

        return {
            id: producer.id,
            kind: producer.kind,
        };
    }
}