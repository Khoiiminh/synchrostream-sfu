import { MediaKind } from "mediasoup/types";

export interface ProducerClosedEvent {
    producerId: string;
    participantId: string;
    kind: MediaKind;
}