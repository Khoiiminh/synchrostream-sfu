import { DtlsParameters, IceCandidate, IceParameters } from "mediasoup/types";

/**
 * The signaling representation of the transport
 */

export interface WebRtcTransportOptions {
    id: string;
    iceParameters: IceParameters;
    iceCandidates: IceCandidate[];
    dtlsParameters: DtlsParameters;
}