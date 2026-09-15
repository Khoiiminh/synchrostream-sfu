import { MediaSessionRuntimeManager } from "../../infrastructure/mediasoup/media-session-runtime.manager.js";
import { GetProducersRequest, GetProducersResponse } from "./get-producers.types.js";

export class GetProducersHandler {
    constructor(
        private readonly mediaSessionRuntimeManager:
            MediaSessionRuntimeManager,
    ) {}

    handle(
        request: GetProducersRequest,
    ): GetProducersResponse {
        const session = this.mediaSessionRuntimeManager.getAssigned(request.mediaSessionId);

        session.assertActive();

        return {
            producers: session.getProducers(),
        };
    }
}