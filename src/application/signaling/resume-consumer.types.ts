export interface ResumeConsumerRequest {
    mediaSessionId: string;
    participantId: string;
    consumerId: string;
}

export interface ResumeConsumerResponse {
    consumerId: string;
}