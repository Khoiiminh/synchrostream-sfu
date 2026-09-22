import { MediaSessionRuntimeManager } from "../../infrastructure/mediasoup/media-session-runtime.manager.js";

export class LeaveSignalingHandler {
    constructor(
        private readonly mediaSessionRuntimeManager: MediaSessionRuntimeManager,
    ) {}

    handle(
        mediaSessionId: string,
        participantId: string,
    ): void {
        const session = this.mediaSessionRuntimeManager.get(mediaSessionId);

        if (!session) {
            return;
        }

        if (!session.hasParticipant(participantId)) {
            return;
        }

        session.removeParticipant(participantId);
    }
}