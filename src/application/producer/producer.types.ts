import { MediaKind, RtpParameters } from "mediasoup/types";

/**
 * The browser will eventually send these values when it wants to produce a track
 */

export interface CreateProducerOptions {
    kind: MediaKind;
    rtpParameters: RtpParameters;
}