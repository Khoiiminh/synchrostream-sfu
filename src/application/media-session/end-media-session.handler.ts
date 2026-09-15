import { MediaSessionRuntimeManager } from "../../infrastructure/mediasoup/media-session-runtime.manager.js";
import { EndMediaSessionRequest, EndMediaSessionResponse } from "./end-media-session.types.js";

export class EndMediaSessionHandler {
    constructor(
        private readonly mediaSessionRuntimeManager: MediaSessionRuntimeManager,
    ) {}

    handle(request: EndMediaSessionRequest): EndMediaSessionResponse {
        this.mediaSessionRuntimeManager.endSession(
            request.mediaSessionId,
        );

        return {
            mediaSessionId:
                request.mediaSessionId,
        };
    }
}