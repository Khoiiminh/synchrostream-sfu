import { MediaKind, RtpParameters } from "mediasoup/types";

export interface ConsumerOptions {
    id: string;
    producerId: string;
    kind: MediaKind;
    rtpParameters: RtpParameters;
}