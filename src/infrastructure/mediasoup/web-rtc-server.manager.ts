import { WebRtcServer, Worker } from "mediasoup/types";
import { SfuConfig } from "../../config/sfu.config.js";

export class WebRtcServerManager {
    private readonly servers: WebRtcServer[] = [];

    constructor(
        private readonly config: SfuConfig,
    ) {}

    async createForWorker(
        worker: Worker,
        workerIndex: number,
    ): Promise<WebRtcServer> {
        const announcedAddress = this.config.rtc.announcedIp;

        if (!announcedAddress) {
            throw new Error(
                `[SFU:${this.config.nodeId}] SFU_RTC_ANNOUNCED_IP is required.`,
            );
        }

        const webRtcServer = await worker.createWebRtcServer({
                listenInfos: [
                    {
                        protocol: 'udp',
                        ip: this.config.rtc.listenIp,
                        announcedAddress,
                        portRange: {
                            min: this.config.rtc.minPort,
                            max: this.config.rtc.maxPort,
                        },
                    },
                    {
                        protocol: 'tcp',
                        ip: this.config.rtc.listenIp,
                        announcedAddress,
                        portRange: {
                            min: this.config.rtc.minPort,
                            max: this.config.rtc.maxPort,
                        },
                    },
                ],
            });

        this.servers.push(webRtcServer);

        console.log(
            `[SFU:${this.config.nodeId}] WebRTC server created`,
            {
                workerIndex,
                workerPid: worker.pid,
                webRtcServerId: webRtcServer.id,
                announcedAddress,
                portRange: {
                    min: this.config.rtc.minPort,
                    max: this.config.rtc.maxPort,
                },
            },
        );

        return webRtcServer;
    }

    getServers(): readonly WebRtcServer[] {
        return this.servers;
    }

    getServerCount(): number {
        return this.servers.length;
    }

    close(): void {
        for (const server of this.servers) {
            server.close();
        }

        this.servers.length = 0;
    }
}