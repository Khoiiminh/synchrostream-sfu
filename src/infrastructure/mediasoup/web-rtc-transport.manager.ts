import { DtlsParameters, Router, WebRtcServer, WebRtcTransport } from "mediasoup/types";
import { WebRtcTransportOptions } from "../../application/transport/web-rtc-transport.types.js";

export class WebRtcTransportManager {
    async createTransport(
        router: Router,
        webRtcServer: WebRtcServer,
    ): Promise<WebRtcTransport> {
        const transport = await router.createWebRtcTransport({
            webRtcServer,
            enableUdp: true,
            enableTcp: true,
            preferUdp: true,
        });

        console.log(
            '[WebRTC] Transport created',
            {
                transportId: transport.id,
                routerId: router.id,
            },
        );

        return transport;
    }

    getTransportOptions(transport: WebRtcTransport): WebRtcTransportOptions{
        return {
            id: transport.id,
            iceParameters: transport.iceParameters,
            iceCandidates: transport.iceCandidates,
            dtlsParameters: transport.dtlsParameters,
        };
    }

    async connectTransport(
        transport: WebRtcTransport,
        dtlsParameters: DtlsParameters,
    ): Promise<void> {
        if (transport.closed) {
            throw new Error(
                `WebRTC transport is closed: ${transport.id}`,
            );
        }

        await transport.connect({
            dtlsParameters,
        });

        console.log(
            '[WebRTC] Transport connected',
            {
                transportId: transport.id,
            },
        );
    }

    closeTransport(transport: WebRtcTransport): void {
        transport.close();
    }
}