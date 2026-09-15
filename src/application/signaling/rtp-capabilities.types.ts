import { RtpCapabilities } from "mediasoup/types";

export interface GetRtpCapabilitiesRequest {
    mediaSessionId: string;
}

export interface GetRtpCapabilitiesResponse {
    rtpCapabilities: RtpCapabilities;
}