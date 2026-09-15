import { MediaSessionRuntimeManager } from "../../infrastructure/mediasoup/media-session-runtime.manager.js";
import { GetRtpCapabilitiesRequest, GetRtpCapabilitiesResponse } from "./rtp-capabilities.types.js";

export class GetRtpCapabilitiesHandler {
    constructor(
        private readonly mediaSessionRuntimeManager: MediaSessionRuntimeManager,
    ) {}

    handle(request: GetRtpCapabilitiesRequest): GetRtpCapabilitiesResponse {
        const session = this.mediaSessionRuntimeManager.getAssigned(request.mediaSessionId);

        session.assertActive();

        return {
            rtpCapabilities: session.getRouter().rtpCapabilities,
        };
    }
}