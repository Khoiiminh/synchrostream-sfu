import { SfuConfig } from "../../config/sfu.config.js";
import { MediaSessionRuntimeManager } from "../../infrastructure/mediasoup/media-session-runtime.manager.js";
import { RouterManager } from "../../infrastructure/mediasoup/router.manager.js";
import { WorkerManager } from "../../infrastructure/mediasoup/worker.manager.js";
import { MediaSessionMetrics } from "../media-session/media-session-metrics.types.js";

export interface SfuMetricsResponse {
    nodeId: string;
    workerCount: number;
    routerCount: number;
    mediaSessionCount: number;
    participantCount: number;
    producerCount: number;
    consumerCount: number;
    transportCount: number;
    sessions: MediaSessionMetrics[];

    memoryUsage: {
        rss: number;
        heapUsed: number;
        heapTotal: number;
    };
    uptimeSeconds: number;
}

export class SfuMetricsHandler {
    constructor(
        private readonly config: SfuConfig,
        private readonly workerManager: WorkerManager,
        private readonly routerManager: RouterManager,
        private readonly mediaSessionRuntimeManager: MediaSessionRuntimeManager,
    ) {}

    handle(): SfuMetricsResponse {
        const sessions = this.mediaSessionRuntimeManager.getSessionMetrics();

        let participantCount = 0;
        let producerCount = 0;
        let consumerCount = 0;
        let transportCount = 0;

        for (const session of sessions) {
            participantCount += session.participantCount;
            producerCount += session.producerCount;
            consumerCount += session.consumerCount;
            transportCount += session.transportCount;
        }

        const memoryUsage = process.memoryUsage();
        const uptimeSeconds = Math.floor(process.uptime());

        return {
            nodeId: this.config.nodeId,
            workerCount: this.workerManager.getWorkerCount(),
            routerCount: this.routerManager.getRouterCount(),
            mediaSessionCount: sessions.length,
            participantCount,
            producerCount,
            consumerCount,
            transportCount,
            sessions,

            memoryUsage: {
                rss: memoryUsage.rss,
                heapUsed: memoryUsage.heapUsed,
                heapTotal: memoryUsage.heapTotal,
            },
            uptimeSeconds,
        };
    }
}