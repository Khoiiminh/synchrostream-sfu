import { Consumer, Producer, Router, RtpCapabilities, WebRtcTransport } from "mediasoup/types";
import { ConsumerOptions } from "../../application/consumer/consumer.types.js";

export class ConsumerManager {
    async createConsumer(
        router: Router,
        transport: WebRtcTransport,
        producer: Producer,
        rtpCapabilities: RtpCapabilities,
    ): Promise<Consumer> {
        if (transport.closed) {
            throw new Error(
                `WebRTC transport is closed: ${transport.id}`,
            );
        }

        if (producer.closed) {
            throw new Error(
                `Producer is closed: ${producer.id}`,
            );
        }

        const canConsume = router.canConsume({
            producerId: producer.id,
            rtpCapabilities,
        });

        if (!canConsume) {
            throw new Error(
                `Cannot consume producer ${producer.id} with the provided RTP capabilities`,
            );
        }

        const consumer = await transport.consume({
            producerId: producer.id,
            rtpCapabilities,
            paused: true,
        });

        console.log(
            '[Consumer] Created',
            {
                consumerId: consumer.id,
                producerId: producer.id,
                transportId: transport.id,
                kind: consumer.kind,
            },
        );

        return consumer;
    }

    resumeConsumer(consumer: Consumer,): void {
        if (consumer.closed) {
            throw new Error(
                `Consumer is closed: ${consumer.id}`,
            );
        }

        consumer.resume();
    }

    getConsumerOptions(consumer: Consumer): ConsumerOptions {
        return {
            id: consumer.id,
            producerId: consumer.producerId,
            kind: consumer.kind,
            rtpParameters: consumer.rtpParameters,
        }
    }

    closeConsumer(consumer: Consumer): void {
        consumer.close();
    }

}