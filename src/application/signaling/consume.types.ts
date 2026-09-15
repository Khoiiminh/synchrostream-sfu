import { MediaKind, RtpCapabilities, RtpParameters } from "mediasoup/types";

export interface ConsumerRequest {
    mediaSessionId: string;
    participantId: string;
    producerId: string;
    rtpCapabilities: RtpCapabilities;
}

export interface ConsumeResponse {
    id: string;
    producerId: string;
    kind: MediaKind;
    rtpParameters: RtpParameters;
}