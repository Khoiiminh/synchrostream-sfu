export interface JoinSignalingRequest {
    token: string;
}

export interface JoinSignalingResponse {
    mediaSessionId: string;
    participantId: string;
}