import { MediaKind, RtpParameters } from "mediasoup/types";

export interface ProduceRequest {
    mediaSessionId: string;
    participantId: string;
    kind: MediaKind;
    rtpParameters: RtpParameters;
}

export interface ProduceResponse {
    id: string;
    kind: MediaKind;
}
