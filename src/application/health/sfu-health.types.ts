export interface SfuHealthResponse {
    nodeId: string;
    status: 'healthy' | 'degraded' | 'unavailable';

    workerCount: number;
    routerCount: number;
    mediaSessionCount: number;

    participantCount: number;
    producerCount: number;
    consumerCount: number;
    transportCount: number;
    
    workerFailureCount: number;
}