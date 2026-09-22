import {
  Consumer,
  DtlsParameters,
  MediaKind,
  Producer,
  Router,
  RtpCapabilities,
  RtpParameters,
  WebRtcServer,
  WebRtcTransport,
} from "mediasoup/types";
import { WebRtcTransportManager } from "../../infrastructure/mediasoup/web-rtc-transport.manager.js";
import { ProducerManager } from "../../infrastructure/mediasoup/producer.manager.js";
import { ConsumerManager } from "../../infrastructure/mediasoup/consumer.manager.js";
import { WebRtcTransportOptions } from "../transport/web-rtc-transport.types.js";
import { MediaTransportMetrics } from "./media-transport-metrics.types.js";

export interface ParticipantRuntimeOptions {
  participantId: string;
  transportManager: WebRtcTransportManager;
  producerManager: ProducerManager;
  consumerManager: ConsumerManager;
  onProducerClosed?: (producer: Producer, participantId: string) => void;
}

export class ParticipantRuntime {
  private readonly participantId: string;
  private readonly transportManager: WebRtcTransportManager;
  private readonly producerManager: ProducerManager;
  private readonly consumerManager: ConsumerManager;

  private readonly producers = new Map<string, Producer>();
  private readonly consumers = new Map<string, Consumer>();

  private sendTransport: WebRtcTransport | undefined;
  private receiveTransport: WebRtcTransport | undefined;

  constructor(options: ParticipantRuntimeOptions) {
    this.participantId = options.participantId;
    this.transportManager = options.transportManager;
    this.producerManager = options.producerManager;
    this.consumerManager = options.consumerManager;
    this.onProducerClosed = options.onProducerClosed;
  }

  async createProducer(
    kind: MediaKind,
    rtpParameters: RtpParameters,
  ): Promise<Producer> {
    if (!this.sendTransport) {
      throw new Error(
        `Send transport does not exist for participant: ${this.participantId}`,
      );
    }

    const producer = await this.producerManager.createProducer(
      this.sendTransport,
      {
        kind,
        rtpParameters,
      },
    );

    producer.on("transportclose", () => {
      console.log("[Producer] Transport closed", {
        producerId: producer.id,
        participantId: this.participantId,
      });

      this.producers.delete(producer.id);

      if (this.onProducerClosed) {
          this.onProducerClosed(producer, this.participantId);
      }
    });

producer.on("score", (score) => {
    console.log("[Producer] Score", {
        producerId: producer.id,
        participantId: this.participantId,
        score,
    });
});

producer.on("videoorientationchange", (orientation) => {
    console.log("[Producer] Video orientation changed", {
        producerId: producer.id,
        orientation,
    });
});

producer.observer.on("close", () => {
    console.log("[Producer] Observer closed", {
        producerId: producer.id,
        participantId: this.participantId,
    });
});

    this.producers.set(producer.id, producer);

    return producer;
  }

  async createConsumer(
    router: Router,
    producer: Producer,
    rtpCapabilities: RtpCapabilities,
  ): Promise<Consumer> {
    if (!this.receiveTransport) {
      throw new Error(
        `Receive transport does not exist for participant: ${this.participantId}`,
      );
    }

    const consumer = await this.consumerManager.createConsumer(
      router,
      this.receiveTransport,
      producer,
      rtpCapabilities,
    );

    this.consumers.set(consumer.id, consumer);

    return consumer;
  }

  async createSendTransport(
    router: Router,
    webRtcServer: WebRtcServer,
  ): Promise<WebRtcTransport> {
    if (this.sendTransport) {
      throw new Error(
        `Send transport already exists for participant: ${this.participantId}`,
      );
    }

    const transport = await this.transportManager.createTransport(
      router,
      webRtcServer,
    );

    this.sendTransport = transport;

    return transport;
  }

  async createReceiveTransport(
    router: Router,
    webRtcServer: WebRtcServer,
  ): Promise<WebRtcTransport> {
    if (this.receiveTransport) {
      throw new Error(
        `Receive transport already exists for participant: ${this.participantId}`,
      );
    }

    const transport = await this.transportManager.createTransport(
      router,
      webRtcServer,
    );

    this.receiveTransport = transport;

    return transport;
  }

  async connectSendTransport(dtlsParameters: DtlsParameters): Promise<void> {
    if (!this.sendTransport) {
      throw new Error(
        `Send transport does not exist for participant: ${this.participantId}`,
      );
    }

    await this.transportManager.connectTransport(
      this.sendTransport,
      dtlsParameters,
    );
  }

  async connectReceiveTransport(dtlsParameters: DtlsParameters): Promise<void> {
    if (!this.receiveTransport) {
      throw new Error(
        `Receive transport does not exist for participant: ${this.participantId}`,
      );
    }

    await this.transportManager.connectTransport(
      this.receiveTransport,
      dtlsParameters,
    );
  }

  close(): void {
    for (const consumer of this.consumers.values()) {
      consumer.close();
    }

    this.consumers.clear();

    for (const producer of this.producers.values()) {
      producer.close();
    }

    this.producers.clear();

    if (this.sendTransport) {
      this.sendTransport.close();
      this.sendTransport = undefined;
    }

    if (this.receiveTransport) {
      this.receiveTransport.close();
      this.receiveTransport = undefined;
    }
  }

  getProducer(producerId: string): Producer | undefined {
    return this.producers.get(producerId);
  }

  getProducers(): readonly Producer[] {
    return Array.from(this.producers.values());
  }

  getProducerCount(): number {
    return this.producers.size;
  }

  getConsumer(consumerId: string): Consumer | undefined {
    return this.consumers.get(consumerId);
  }

  getConsumers(): readonly Consumer[] {
    return Array.from(this.consumers.values());
  }

  getConsumerCount(): number {
    return this.consumers.size;
  }

  getParticipantId(): string {
    return this.participantId;
  }

  getTransportOptions(transport: WebRtcTransport): WebRtcTransportOptions {
    return this.transportManager.getTransportOptions(transport);
  }

  getTransportCount(): number {
    let count = 0;

    if (this.sendTransport !== undefined) {
      count += 1;
    }

    if (this.receiveTransport !== undefined) {
      count += 1;
    }

    return count;
  }

  getSendTransport(): WebRtcTransport | undefined {
    return this.sendTransport;
  }

  getReceiveTransport(): WebRtcTransport | undefined {
    return this.receiveTransport;
  }

  getConsumersForProducer(producerId: string): Consumer[] {
    const consumers: Consumer[] = [];

    for (const consumer of this.consumers.values()) {
      if (consumer.producerId === producerId) {
        consumers.push(consumer);
      }
    }

    return consumers;
  }

    getTransportMetrics(): MediaTransportMetrics[] {
        const metrics: MediaTransportMetrics[] = [];

        if (this.sendTransport !== undefined) {
            metrics.push({
                id: this.sendTransport.id,
                direction: 'send',
            });
        }

        if (this.receiveTransport !== undefined) {
            metrics.push({
                id: this.receiveTransport.id,
                direction: 'receive',
            });
        }

        return metrics;
    }

  private readonly onProducerClosed:
    | ((producer: Producer, participantId: string) => void)
    | undefined;

  resumeConsumer(consumer: Consumer): void {
    this.consumerManager.resumeConsumer(consumer);
  }

  removeConsumer(consumerId: string): void {
    const consumer = this.consumers.get(consumerId);

    if (!consumer) {
      return;
    }

    consumer.close();

    this.consumers.delete(consumerId);
  }
}
