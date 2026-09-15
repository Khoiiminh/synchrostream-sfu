import { MediaSessionRuntimeManager } from "../../infrastructure/mediasoup/media-session-runtime.manager.js";
import { ResumeConsumerRequest, ResumeConsumerResponse } from "./resume-consumer.types.js";

export class ResumeConsumerHandler {
    constructor(
        private readonly mediaSessionRuntimeManager:
            MediaSessionRuntimeManager,
    ) {}

    handle(
        request: ResumeConsumerRequest,
    ): ResumeConsumerResponse {
        const session = this.mediaSessionRuntimeManager.getAssigned(request.mediaSessionId);

        session.assertActive();

        const participant = session.getParticipant(request.participantId);

        if (!participant) {
            throw new Error(
                `Participant not found: ${request.participantId}`,
            );
        }

        const consumer = participant.getConsumer(request.consumerId);

        if (!consumer) {
            throw new Error(
                `Consumer not found: ${request.consumerId}`,
            );
        }

        participant.resumeConsumer(consumer);

        return {
            consumerId: consumer.id,
        };
    }
}