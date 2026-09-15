import { MediaSessionRuntimeManager } from "../../infrastructure/mediasoup/media-session-runtime.manager.js";
import { ConsumeResponse, ConsumerRequest } from "./consume.types.js";

export class ConsumeHandler {
    constructor(
        private readonly mediaSessionRuntimeManager: MediaSessionRuntimeManager,
    ) {}

    async handle(request: ConsumerRequest): Promise<ConsumeResponse> {
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

        const producer = session.getProducer(
            request.producerId,
        );

        if (!producer) {
            throw new Error(
                `Producer not found: ${request.producerId}`,
            );
        }

        const consumer = await participant.createConsumer(
            session.getRouter(),
            producer,
            request.rtpCapabilities,
        );

        return {
            id: consumer.id,
            producerId: consumer.producerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
        };
    }
}