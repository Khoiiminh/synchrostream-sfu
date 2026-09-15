import { Producer, Router, WebRtcServer } from "mediasoup/types";
import { MediaSessionRuntime } from "../../application/media-session/media-session-runtime.js";
import { WebRtcTransportManager } from "./web-rtc-transport.manager.js";
import { ProducerManager } from "./producer.manager.js";
import { ConsumerManager } from "./consumer.manager.js";
import { RouterManager } from "./router.manager.js";
import { WebRtcServerManager } from "./web-rtc-server.manager.js";
import { WorkerManager } from "./worker.manager.js";
import { MEDIA_CODECS } from "./media-codecs.js";
import { SfuConfig } from "../../config/sfu.config.js";
import { CreateMediaSessionRequest } from "../../application/media-session/create-media-session.types.js";
import { MediaSessionMetrics } from "../../application/media-session/media-session-metrics.types.js";

export class MediaSessionRuntimeManager {
  private readonly sessions = new Map<string, MediaSessionRuntime>();

  constructor(
    private readonly transportManager: WebRtcTransportManager,
    private readonly producerManager: ProducerManager,
    private readonly consumerManager: ConsumerManager,
    private readonly routerManager: RouterManager,
    private readonly webRtcServerManager: WebRtcServerManager,
    private readonly workerManager: WorkerManager,
    private readonly config: SfuConfig,
  ) {}

  create(
    mediaSessionId: string,
    router: Router,
    webRtcServer: WebRtcServer,
  ): MediaSessionRuntime {
    const existingSession = this.sessions.get(mediaSessionId);

    if (existingSession) {
      throw new Error(`MediaSession runtime already exists: ${mediaSessionId}`);
    }

    const session = new MediaSessionRuntime({
      mediaSessionId,
      router,
      webRtcServer,
      transportManager: this.transportManager,
      producerManager: this.producerManager,
      consumerManager: this.consumerManager,
      nodeId: this.config.nodeId,
      onRouterClosed: (closedMediaSessionId) => {
        this.handleRouterClosed(closedMediaSessionId);
      },
    });

    this.sessions.set(mediaSessionId, session);

    console.log(`[MediaSession:${mediaSessionId}] Runtime created`);

    return session;
  }

  async createSession(
    request: CreateMediaSessionRequest,
  ): Promise<MediaSessionRuntime> {
    const existingSession = this.sessions.get(request.mediaSessionId);

    if (existingSession) {
      throw new Error(`MediaSession already exists: ${request.mediaSessionId}`);
    }

    if (request.assignedSfuNodeId !== this.config.nodeId) {
      throw new Error(
        `MediaSession ${request.mediaSessionId} is not assigned to this SFU node`,
      );
    }

    const workers = this.workerManager.getWorkers();

    if (workers.length === 0) {
      throw new Error("No mediasoup workers are available");
    }

    const worker = workers[0]!;

    const webRtcServers = this.webRtcServerManager.getServers();

    if (webRtcServers.length === 0) {
      throw new Error("No WebRTC servers are available");
    }

    const webRtcServer = webRtcServers[0]!;

    const router = await this.routerManager.createRouter(worker, MEDIA_CODECS);

    const session = this.create(request.mediaSessionId, router, webRtcServer);

    session.start();

    return session;
  }

  endSession(mediaSessionId: string): void {
    const session = this.getAssigned(mediaSessionId);

    session.close();

    this.sessions.delete(mediaSessionId);
  }

  get(mediaSessionId: string): MediaSessionRuntime | undefined {
    return this.sessions.get(mediaSessionId);
  }

  getSessionCount(): number {
    return this.sessions.size;
  }

  getRequired(mediaSessionId: string): MediaSessionRuntime {
    const session = this.sessions.get(mediaSessionId);

    if (!session) {
      throw new Error(`MediaSession runtime not found: ${mediaSessionId}`);
    }

    if (session.isClosed()) {
      throw new Error(`MediaSession runtime is closed: ${mediaSessionId}`);
    }

    return session;
  }

    getAssigned(mediaSessionId: string): MediaSessionRuntime {
        const session = this.getRequired(mediaSessionId);

        if (session.getNodeId() !== this.config.nodeId) {
            throw new Error(
                `MediaSession ${mediaSessionId} is not assigned to this SFU node`,
            );
        }

        return session;
    }

    getSessions(): readonly MediaSessionRuntime[] {
        return Array.from(this.sessions.values());
    }

    getSessionMetrics(): MediaSessionMetrics[] {
        const metrics: MediaSessionMetrics[] = [];

        for (const session of this.sessions.values()) {
            metrics.push(session.getMetrics());
        }

        return metrics;
    }       

  has(mediaSessionId: string): boolean {
    return this.sessions.has(mediaSessionId);
  }

  private handleRouterClosed(mediaSessionId: string): void {
    const session = this.sessions.get(mediaSessionId);

    if (!session) {
      return;
    }

    session.close();

    this.sessions.delete(mediaSessionId);
  }

  remove(mediaSessionId: string): void {
    const session = this.sessions.get(mediaSessionId);

    if (!session) {
      return;
    }

    session.close();

    this.sessions.delete(mediaSessionId);

    console.log(`[MediaSession:${mediaSessionId}] Runtime removed`);
  }

  validateAssignment(mediaSessionId: string, assignedNodeId: string): void {
    const session = this.getRequired(mediaSessionId);

    if (session.getNodeId() !== assignedNodeId) {
      throw new Error(
        `MediaSession ${mediaSessionId} is not assigned to ${assignedNodeId}`,
      );
    }
  }

  close(): void {
    for (const session of this.sessions.values()) {
      session.close();
    }

    this.sessions.clear();
  }
}
