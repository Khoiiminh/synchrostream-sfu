import { SfuConfig } from "../../config/sfu.config.js";
import { MediaSessionRuntimeManager } from "../../infrastructure/mediasoup/media-session-runtime.manager.js";
import { RouterManager } from "../../infrastructure/mediasoup/router.manager.js";
import { WorkerManager } from "../../infrastructure/mediasoup/worker.manager.js";
import { SfuHealthResponse } from "./sfu-health.types.js";

export class SfuHealthHandler {
    constructor(
        private readonly config: SfuConfig,
        private readonly workerManager: WorkerManager,
        private readonly routerManager: RouterManager,
        private readonly mediaSessionRuntimeManager:
            MediaSessionRuntimeManager,
    ) {}

    handle(): SfuHealthResponse {
        const workerCount = this.workerManager.getWorkerCount();
        const workerFailureCount = this.workerManager.getWorkerFailureCount();

        const routerCount = this.routerManager.getRouterCount();

        const mediaSessionCount = this.mediaSessionRuntimeManager.getSessionCount();

        let participantCount = 0;
        let producerCount = 0;
        let consumerCount = 0;
        let transportCount = 0;

        for (const session of this.mediaSessionRuntimeManager.getSessions()) {
            participantCount += session.getParticipantCount();
            producerCount += session.getProducerCount();
            consumerCount += session.getConsumerCount();
            transportCount += session.getTransportCount();
        }

        let status:
            | 'healthy'
            | 'degraded'
            | 'unavailable';

        if (workerCount === 0) {
            status = 'unavailable';
        } else if (workerFailureCount > 0) {
            status = 'degraded';
        } else if (routerCount === 0 && mediaSessionCount > 0) {
            status = 'degraded';
        } else {
            status = 'healthy';
        }

        return {
            nodeId: this.config.nodeId,
            status,
            workerCount,
            routerCount,
            mediaSessionCount,
            participantCount,
            producerCount,
            consumerCount,
            transportCount,
            workerFailureCount,
        };
    }
}