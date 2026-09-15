import jwt from 'jsonwebtoken';

export interface SignalingTokenPayload {
    sub: string;
    mediaSessionId: string;
    participantId: string;
    nodeId: string;
}

export interface AuthenticatedSignalingClient {
    mediaSessionId: string;
    participantId: string;
}

export class SignalingAuthenticator {
    constructor(
        private readonly secret: string,
        private readonly nodeId: string,
    ) {}

    authenticate(token: string): AuthenticatedSignalingClient {
        const payload = jwt.verify(
                token,
                this.secret,
            ) as SignalingTokenPayload;

        if (
            payload.mediaSessionId === undefined ||
            payload.participantId === undefined ||
            payload.nodeId === undefined
        ) {
            throw new Error(
                'Invalid signaling token claims',
            );
        }

        if (payload.nodeId !== this.nodeId) {
            throw new Error(
                'Signaling token is not valid for this SFU node',
            );
        }

        return {
            mediaSessionId: payload.mediaSessionId,
            participantId: payload.participantId,
        };
    }
}