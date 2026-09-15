import { MediaKind } from "mediasoup/types";

export interface GetProducersRequest {
    mediaSessionId: string;
    participantId: string;
}

export interface ProducerInfo {
    id: string;
    participantId: string;
    kind: MediaKind;
}

export interface GetProducersResponse {
    producers: ProducerInfo[];
}