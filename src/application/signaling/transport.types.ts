import { DtlsParameters } from "mediasoup/types";
import { WebRtcTransportOptions } from "../transport/web-rtc-transport.types.js";

export type TransportDirection =
    | 'send'
    | 'receive';

export interface CreateTransportRequest {
    mediaSessionId: string;
    participantId: string;
    direction: TransportDirection;
}

export interface CreateTransportResponse {
    direction: TransportDirection;
    transport: WebRtcTransportOptions;
}

export interface ConnectTransportRequest {
    mediaSessionId: string;
    participantId: string;
    direction: TransportDirection;
    dtlsParameters: DtlsParameters;
}

export interface ConnectTransportResponse {
    direction: TransportDirection;
}