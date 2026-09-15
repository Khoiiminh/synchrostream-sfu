import { Router, WebRtcServer } from "mediasoup/types";
import { MediaSessionRuntimeManager } from "../../infrastructure/mediasoup/media-session-runtime.manager.js";
import { CreateMediaSessionRequest, CreateMediaSessionResponse } from "./create-media-session.types.js";

export class CreateMediaSessionHandler {
    constructor(
        private readonly mediaSessionRuntimeManager: MediaSessionRuntimeManager
    ) {}

    async handle(request: CreateMediaSessionRequest): Promise<CreateMediaSessionResponse> {
        await this.mediaSessionRuntimeManager.createSession(request);

        return {
            mediaSessionId: request.mediaSessionId,
            assignedSfuNodeId: request.assignedSfuNodeId,
        };
    }
}