import express, {
    type Express,
    type Request,
    type Response,
} from 'express';

import { CreateMediaSessionHandler } from "../media-session/create-media-session.handler.js";
import { EndMediaSessionHandler } from '../media-session/end-media-session.handler.js';
import { SfuHealthHandler } from '../health/sfu-health.handler.js';
import { SfuMetricsHandler } from '../metrics/sfu-metrics.handler.js';

export class SfuControlServer {
    private readonly app: Express;
    private readonly port: number;
    private server: ReturnType<typeof this.app.listen> | undefined;

    constructor(
        private readonly createMediaSessionHandler: CreateMediaSessionHandler,
        private readonly endMediaSessionHandler: EndMediaSessionHandler,
        private readonly sfuHealthHandler: SfuHealthHandler,
        private readonly metricsHandler: SfuMetricsHandler,
        private readonly secret: string,
        port: number,
    ) {
        this.app = express();
        this.port = port;

        this.app.use(express.json());

        this.registerRoutes();
    }

    private authenticate(request: Request): void {
        const authorization = request.headers.authorization;

        if (!authorization) {
            throw new Error(
                'Authorization header is required',
            );
        }

        if (!authorization.startsWith('Bearer ')) {
            throw new Error(
                'Invalid authorization scheme',
            );
        }

        const token = authorization.slice(7);

        if (token !== this.secret) {
            throw new Error(
                'Invalid control-plane credentials',
            );
        }
    }

    private registerRoutes(): void {
        this.app.post(
            '/control/media-sessions',
            async (
                request: Request,
                response: Response,
            ) => {
                try {
                    this.authenticate(request);

                    const result = await this.createMediaSessionHandler.handle(request.body);

                    response.status(201).json(result);
                } catch (error) {
                    console.error(
                        '[SFU Control] Failed to create MediaSession',
                        error,
                    );

                    response.status(400).json({
                        message:
                            error instanceof Error
                                ? error.message
                                : 'Unknown error',
                    });
                }
            },
        );

        this.app.delete(
            '/control/media-sessions/:mediaSessionId',
            async (
                request: Request<{ mediaSessionId: string }>,
                response: Response,
            ) => {
                try {
                    this.authenticate(request);

                    const result = this.endMediaSessionHandler.handle({
                        mediaSessionId: request.params.mediaSessionId,
                    });

                    response.status(200).json(result);
                } catch (error) {
                    console.error(
                        '[SFU Control] Failed to end MediaSession',
                        error,
                    );

                    response.status(400).json({
                        message: error instanceof Error
                            ? error.message
                            : 'Unknown error',
                    });
                }
            },
        );

        this.app.get(
            '/control/health', (request: Request, response: Response) => {
                try {
                    this.authenticate(request);

                    const result = this.sfuHealthHandler.handle();

                    response.status(200).json(result);
                } catch (error) {
                    console.error(
                        '[SFU Control] Health check failed',
                        error,
                    );

                    response.status(401).json({
                        message:
                            error instanceof Error
                                ? error.message
                                : 'Unknown error',
                    });
                }
            },
        );

        this.app.get('/control/metrics', (request, response) => {
            try {
                this.authenticate(request);

                const result = this.metricsHandler.handle();

                response.status(200).json(result);
            } catch (error) {
                console.error('[SFU Control] Metrics request failed', error);

                response.status(401).json({
                    error: 'Unauthorized',
                });
            }
        });
    }

    start(): void {
        this.server = this.app.listen(this.port, () => {
            console.log(
                `[SFU Control] Control server listening on port ${this.port}`,
            );
        });
    }

    async close(): Promise<void> {
        if (this.server === undefined) {
            return;
        }

        await new Promise<void>((resolve, reject) => {
            this.server?.close((error) => {
                if (error) {
                    reject(error);
                    return;
                }

                resolve();
            });
        });

        this.server = undefined;
    }
}