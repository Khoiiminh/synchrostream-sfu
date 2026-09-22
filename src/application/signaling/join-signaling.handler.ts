import { MediaSessionRuntimeManager } from "../../infrastructure/mediasoup/media-session-runtime.manager.js";

export interface JoinSignalingCommand {
    mediaSessionId: string;
    participantId: string;
}

export class JoinSignalingHandler {
    constructor(
        private readonly mediaSessionRuntimeManager: MediaSessionRuntimeManager,
    ) {}

    handle(command: JoinSignalingCommand): void {
        const runtime = this.mediaSessionRuntimeManager.getRequired(
            command.mediaSessionId,
        );

        runtime.addParticipant(command.participantId);
    }
}