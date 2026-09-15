import { MediaKind } from "mediasoup/types";

export interface NewProducerEvent {
    producerId: string;
    participantId: string;
    kind: MediaKind;
}