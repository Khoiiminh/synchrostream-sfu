import "dotenv/config";

export interface SfuConfig {
    nodeId: string;

    http: {
        host: string;
        port: number;
    }

    rtc: {
        listenIp: string;
        announcedIp: string | undefined;
        minPort: number;
        maxPort: number;
    };

    mediasoup: {
        workerCount: number;
        logLevel: 'debug' | 'warn' | 'error' | 'none';
    };

    ws: {
        port: number;
    };

    signaling:  {
        jwtSecret: string;
    };

    control: {
        port: number;
        secret: string;
    }
}

function getNumber(
    value: string | undefined,
    fallback: number
): number {
    if (!value) {
        return fallback;
    }

    const parsed = Number(value);

    if (!Number.isFinite(parsed)) {
        throw new Error(
            `Invalid numeric configuration value: ${value}`,
        );
    }

    return parsed;
}

export function loadSfuConfig(): SfuConfig {
    const nodeId = process.env.SFU_NODE_ID;

    if (!nodeId) {
        throw new Error('SFU_NODE_ID is required');
    }

    const signalingJwtSecret = process.env.SFU_SIGNALING_JWT_SECRET;

    if (!signalingJwtSecret) {
        throw new Error(
            'SFU_SIGNALING_JWT_SECRET is required',
        );
    }

    const controlSecret = process.env.SFU_CONTROL_SECRET;

    if (!controlSecret) {
        throw new Error(
            'SFU_CONTROL_SECRET is required',
        )
    }

    return {
        nodeId,

        http: {
            host: process.env.SFU_HTTP_HOST ?? '0.0.0.0',
            port: getNumber(
                process.env.SFU_HTTP_PORT, 
                4000,
            ),
        },

        rtc: {
            listenIp: process.env.SFU_RTC_LISTEN_IP ?? '0.0.0.0',

            announcedIp: process.env.SFU_RTC_ANNOUNCED_IP || undefined,

            minPort: getNumber(
                process.env.SFU_RTC_MIN_PORT, 
                40000
            ),

            maxPort: getNumber(
                process.env.SFU_RTC_MAX_PORT,
                49999
            ),
        },

        mediasoup: {
            workerCount: getNumber(
                process.env.SFU_WORKER_COUNT,
                1
            ),

            logLevel: (
                process.env.MEDIASOUP_LOG_LEVEL as 
                    | 'debug'
                    | 'warn'
                    | 'error'
                    | 'none') ?? 'warn',
        },

        ws: {
            port: getNumber(
                process.env.SFU_WS_PORT,
                4001
            ),
        },

        signaling: {
            jwtSecret: process.env.SFU_SIGNALING_JWT_SECRET!,
        },

        control: {
            port: getNumber(process.env.SFU_CONTROL_PORT, 4002),
            secret: controlSecret,
        },
    };
}   