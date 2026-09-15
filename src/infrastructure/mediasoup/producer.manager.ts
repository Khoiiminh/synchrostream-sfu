import { Producer, WebRtcTransport } from "mediasoup/types";
import { CreateProducerOptions } from "../../application/producer/producer.types.js";

export class ProducerManager {
    async createProducer(
        transport: WebRtcTransport,
        options: CreateProducerOptions,
    ): Promise<Producer> {
        if (transport.closed) {
            throw new Error(
                `WebRTC transport is closed: ${transport.id}`,
            );
        }

        const producer = await transport.produce({
            kind: options.kind,
            rtpParameters: options.rtpParameters,
        });

        console.log(
            '[Producer] Created',
            {
                producerId: producer.id,
                transportId: transport.id,
                kind: producer.kind,
            },
        );

        return producer;
    }

    closeProducer(producer: Producer): void {
        producer.close();
    }
}