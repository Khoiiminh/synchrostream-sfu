import { SfuControlServer } from './application/control/sfu-control.server.js';
import { SfuHealthHandler } from './application/health/sfu-health.handler.js';
import { CreateMediaSessionHandler } from './application/media-session/create-media-session.handler.js';
import { EndMediaSessionHandler } from './application/media-session/end-media-session.handler.js';
import { SfuMetricsHandler } from './application/metrics/sfu-metrics.handler.js';
import { ConnectTransportHandler } from './application/signaling/connect-transport.handler.js';
import { ConsumeHandler } from './application/signaling/consume.handler.js';
import { CreateTransportHandler } from './application/signaling/create-transport.handler.js';
import { GetProducersHandler } from './application/signaling/get-producers.handler.js';
import { GetRtpCapabilitiesHandler } from './application/signaling/get-rtp-capabilities.handler.js';
import { JoinSignalingHandler } from './application/signaling/join-signaling.handler.js';
import { ProduceHandler } from './application/signaling/produce.handler.js';
import { ResumeConsumerHandler } from './application/signaling/resume-consumer.handler.js';
import { SignalingAuthenticator } from './application/signaling/signaling-authenticator.js';
import { WebSocketSignalingServer } from './application/signaling/websocket.signaling.server.js';
import { loadSfuConfig } from './config/sfu.config.js';
import { ConsumerManager } from './infrastructure/mediasoup/consumer.manager.js';
import { MediaSessionRuntimeManager } from './infrastructure/mediasoup/media-session-runtime.manager.js';
import { ProducerManager } from './infrastructure/mediasoup/producer.manager.js';
import { RouterManager } from './infrastructure/mediasoup/router.manager.js';
import { WebRtcServerManager } from './infrastructure/mediasoup/web-rtc-server.manager.js';
import { WebRtcTransportManager } from './infrastructure/mediasoup/web-rtc-transport.manager.js';
import { WorkerManager } from './infrastructure/mediasoup/worker.manager.js';

export interface SfuApplication {
    start(): Promise<void>;
    shutdown(): Promise<void>;
}

export function createSfuApplication(): SfuApplication {
    const config = loadSfuConfig();

    const signalingAuthenticator = new SignalingAuthenticator(config.signaling.jwtSecret, config.nodeId);

    const workerManager = new WorkerManager(config);

    const routerManager = new RouterManager();

    const webRtcServerManager = new WebRtcServerManager(config);

    const producerManager = new ProducerManager();
    const consumerManager = new ConsumerManager();

    const transportManager = new WebRtcTransportManager();

    const mediaSessionRuntimeManager = new MediaSessionRuntimeManager(
        transportManager,
        producerManager,
        consumerManager,
        routerManager,
        webRtcServerManager,
        workerManager,
        config,
    );

    const sfuHealthHandler = new SfuHealthHandler(
        config,
        workerManager,
        routerManager,
        mediaSessionRuntimeManager,
    );

    const sfuMetricsHandler = new SfuMetricsHandler(
        config,
        workerManager,
        routerManager,
        mediaSessionRuntimeManager,
    );

    const createMediaSessionHandler = new CreateMediaSessionHandler(mediaSessionRuntimeManager);

    const endMediaSessionHandler = new EndMediaSessionHandler(mediaSessionRuntimeManager);

    const consumeHandler = new ConsumeHandler(mediaSessionRuntimeManager);
    const produceHandler = new ProduceHandler(mediaSessionRuntimeManager);
    const createTransportHandler = new CreateTransportHandler(mediaSessionRuntimeManager);
    const connectTransportHandler = new ConnectTransportHandler(mediaSessionRuntimeManager);
    const getProducersHandler = new GetProducersHandler(mediaSessionRuntimeManager);
    const resumeConsumerHandler = new ResumeConsumerHandler(mediaSessionRuntimeManager);
    const joinSignalingHandler = new JoinSignalingHandler(mediaSessionRuntimeManager);
    const getRtpCapabilitiesHandler = new GetRtpCapabilitiesHandler(mediaSessionRuntimeManager);

    const signalingServer = new WebSocketSignalingServer(
        {
            consumeHandler,
            produceHandler,
            getProducersHandler,
            getRtpCapabilitiesHandler,
            createTransportHandler,
            connectTransportHandler,
            resumeConsumerHandler,
            signalingAuthenticator,
            joinSignalingHandler,
        },
        config.ws.port,
    );

    const controlServer = new SfuControlServer(
        createMediaSessionHandler,
        endMediaSessionHandler,
        sfuHealthHandler,
        sfuMetricsHandler,
        config.control.secret,
        config.control.port,
    );

    return {
        async start() {
            await workerManager.start();

            const workers = workerManager.getWorkers();

            if (workers.length === 0) {
                throw new Error(
                    `[SFU:${config.nodeId}] No mediasoup workers available`,
                );
            }

            await webRtcServerManager.createForWorker(workers[0]!, 0);

            signalingServer.start();

            controlServer.start();

            console.log(
                `[SFU:${config.nodeId}] SFU application started`,
            );
        },

        async shutdown() {
            console.log(
                `[SFU:${config.nodeId}] Shutting down`,
            );

            await signalingServer.close();
            
            mediaSessionRuntimeManager.close();

            webRtcServerManager.close();
            await routerManager.close();
            await workerManager.close();

            console.log(
                `[SFU:${config.nodeId}] Shutdown complete`,
            );
        },
    };
}