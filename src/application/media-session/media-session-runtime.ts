import { Producer, Router, WebRtcServer } from "mediasoup/types";
import { ParticipantRuntime } from "./participant-runtime.js";
import { WebRtcTransportManager } from "../../infrastructure/mediasoup/web-rtc-transport.manager.js";
import { ProducerManager } from "../../infrastructure/mediasoup/producer.manager.js";
import { ConsumerManager } from "../../infrastructure/mediasoup/consumer.manager.js";
import { ProducerInfo } from "../signaling/get-producers.types.js";
import { MediaSessionRuntimeStatus } from "./media-session-runtime-status.js";
import { MediaSessionMetrics } from "./media-session-metrics.types.js";
import { MediaTransportMetrics } from "./media-transport-metrics.types.js";

export interface MediaSessionRuntimeOptions {
  mediaSessionId: string;
  nodeId: string;
  router: Router;
  webRtcServer: WebRtcServer;
  transportManager: WebRtcTransportManager;
  producerManager: ProducerManager;
  consumerManager: ConsumerManager;
  onRouterClosed?: (mediaSessionId: string) => void;
}

type ProducerClosedListener = (
  producer: Producer,
  participantId: string,
) => void;

export class MediaSessionRuntime {
  private readonly mediaSessionId: string;
  private readonly nodeId: string;
  private readonly router: Router;
  private readonly webRtcServer: WebRtcServer;
  private readonly transportManager: WebRtcTransportManager;
  private readonly producerManager: ProducerManager;
  private readonly consumerManager: ConsumerManager;
  private readonly producerClosedListeners = new Set<ProducerClosedListener>();
  private readonly onRouterClosed:
    | ((mediaSessionId: string) => void)
    | undefined;

  private readonly participants = new Map<string, ParticipantRuntime>();

  private status = MediaSessionRuntimeStatus.CREATED;
  private closing = false;

  constructor(options: MediaSessionRuntimeOptions) {
    this.mediaSessionId = options.mediaSessionId;
    this.router = options.router;
    this.webRtcServer = options.webRtcServer;
    this.transportManager = options.transportManager;
    this.producerManager = options.producerManager;
    this.consumerManager = options.consumerManager;
    this.nodeId = options.nodeId;
    this.onRouterClosed = options.onRouterClosed;
    this.router.on("workerclose", () => {
      if (this.closing) return;

      if (this.onRouterClosed) {
        this.onRouterClosed(this.mediaSessionId);
      }
    });
  }

  addParticipant(participantId: string): ParticipantRuntime {
    this.assertActive();

    if (this.isClosed()) {
      throw new Error(`MediaSession runtime is closed: ${this.mediaSessionId}`);
    }

    const existingParticipant = this.participants.get(participantId);

    if (existingParticipant) {
      throw new Error(`Participant already exists: ${participantId}`);
    }

    const participant = new ParticipantRuntime({
      participantId,
      transportManager: this.transportManager,
      producerManager: this.producerManager,
      consumerManager: this.consumerManager,
      onProducerClosed: (producer, closedParticipantId) => {
        this.handleProducerClosed(producer, closedParticipantId);
      },
    });

    this.participants.set(participantId, participant);

    console.log(`[MediaSession:${this.mediaSessionId}] Participant added`, {
      participantId,
    });

    return participant;
  }

  assertActive(): void {
    if (this.status !== MediaSessionRuntimeStatus.ACTIVE) {
      throw new Error(
        `MediaSession runtime is not active: ${this.mediaSessionId}`,
      );
    }
  }

  getMediaSessionId(): string {
    return this.mediaSessionId;
  }

  getNodeId(): string {
    return this.nodeId;
  }

  getRouter(): Router {
    return this.router;
  }

  getWebRtcServer(): WebRtcServer {
    return this.webRtcServer;
  }

  getStatus(): MediaSessionRuntimeStatus {
    return this.status;
  }

  isClosed(): boolean {
    return this.status === MediaSessionRuntimeStatus.ENDED;
  }

  getParticipant(participantId: string): ParticipantRuntime | undefined {
    this.assertActive();

    return this.participants.get(participantId);
  }

  getProducer(producerId: string): Producer | undefined {
    this.assertActive();

    for (const participant of this.participants.values()) {
      const producer = participant.getProducer(producerId);

      if (producer) {
        return producer;
      }
    }

    return undefined;
  }

  getProducers(): ProducerInfo[] {
    this.assertActive();

    const producers: ProducerInfo[] = [];

    for (const participant of this.participants.values()) {
      for (const producer of participant.getProducers()) {
        producers.push({
          id: producer.id,
          participantId: participant.getParticipantId(),
          kind: producer.kind,
        });
      }
    }

    return producers;
  }

  getProducerCount(): number {
    let count = 0;

    for (const participant of this.participants.values()) {
      count += participant.getProducers().length;
    }

    return count;
  }

  getConsumerCount(): number {
    let count = 0;

    for (const participant of this.participants.values()) {
      count += participant.getConsumers().length;
    }

    return count;
  }

  getTransportCount(): number {
    let count = 0;

    for (const participant of this.participants.values()) {
      count += participant.getTransportCount();
    }

    return count;
  }

  getMetrics(): MediaSessionMetrics {
    return {
      mediaSessionId: this.mediaSessionId,
      participantCount: this.getParticipantCount(),
      producerCount: this.getProducerCount(),
      consumerCount: this.getConsumerCount(),
      transportCount: this.getTransportCount(),
    };
  }

    getTransportMetrics(): MediaTransportMetrics[] {
      const metrics: MediaTransportMetrics[] = [];

      for (const participant of this.participants.values()) {
          metrics.push(...participant.getTransportMetrics());
      }

      return metrics;
  }

  hasParticipant(participantId: string): boolean {
    return this.participants.has(participantId);
  }

  private handleProducerClosed(
    producer: Producer,
    participantId: string,
  ): void {
    this.cleanupProducerConsumers(producer.id);

    for (const listener of this.producerClosedListeners) {
      listener(producer, participantId);
    }
  }

  onProducerClosed(listener: ProducerClosedListener): void {
    this.producerClosedListeners.add(listener);
  }

  removeParticipant(participantId: string): void {
    const participant = this.participants.get(participantId);

    if (!participant) {
      return;
    }

    participant.close();

    this.participants.delete(participantId);

    console.log(`[MediaSession:${this.mediaSessionId}] Participant removed`, {
      participantId,
    });
  }

  start(): void {
    if (this.status !== MediaSessionRuntimeStatus.CREATED) {
      throw new Error(
        `MediaSessionRuntime cannot start from status ${this.status}`,
      );
    }

    this.status = MediaSessionRuntimeStatus.STARTING;

    this.status = MediaSessionRuntimeStatus.ACTIVE;
  }

  getParticipantCount(): number {
    return this.participants.size;
  }

  close(): void {
    if (this.isClosed()) {
      return;
    }

    this.closing = true;

    this.status = MediaSessionRuntimeStatus.ENDING;

    for (const participant of this.participants.values()) {
      participant.close();
    }

    this.participants.clear();
    this.producerClosedListeners.clear();

    this.status = MediaSessionRuntimeStatus.ENDED;

    if (!this.router.closed) {
      this.router.close();
    }

    console.log(`[MediaSession:${this.mediaSessionId}] Runtime closed`);
  }

  private cleanupProducerConsumers(producerId: string): void {
    for (const participant of this.participants.values()) {
      const consumers = participant.getConsumersForProducer(producerId);

      for (const consumer of consumers) {
        participant.removeConsumer(consumer.id);
      }
    }
  }
}
