import { Router, RouterRtpCodecCapability, Worker } from "mediasoup/types";

export class RouterManager {
    private readonly routers: Router[] = [];

    async createRouter(
        worker: Worker,
        mediaCodecs: RouterRtpCodecCapability[],
    ): Promise<Router> {
        const router = await worker.createRouter({
            mediaCodecs,
        });

        this.routers.push(router);

        console.log(
            `[Router] Created`,
            {
                routerId: router.id,
                workerPid: worker.pid,
            },
        );

        return router;
    }

    getRouters(): readonly Router[] {
        return this.routers;
    }

    getRouterCount(): number {
        return this.routers.length;
    }

    async close(): Promise<void> {
        for (const router of this.routers) {
            router.close();
        }

        this.routers.length = 0;
    }
}