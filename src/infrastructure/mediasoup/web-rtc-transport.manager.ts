import {
  DtlsParameters,
  Router,
  WebRtcServer,
  WebRtcTransport,
} from "mediasoup/types";
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

    transport.on("icestatechange", (iceState) => {
      console.log("[WebRTC Transport] ICE state changed", {
        transportId: transport.id,
        iceState,
      });
    });

    transport.on("iceselectedtuplechange", (iceSelectedTuple) => {
      console.log("[WebRTC Transport] ICE selected tuple changed", {
        transportId: transport.id,
        iceSelectedTuple,
      });
    });

    transport.on("dtlsstatechange", (dtlsState) => {
      console.log("[WebRTC Transport] DTLS state changed", {
        transportId: transport.id,
        dtlsState,
      });
    });

    transport.on("@close", () => {
      console.log("[WebRTC Transport] Closed", {
        transportId: transport.id,
      });
    });

    console.log("[WebRTC] Transport created", {
      transportId: transport.id,
      routerId: router.id,
    });

    return transport;
  }

  getTransportOptions(transport: WebRtcTransport): WebRtcTransportOptions {
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
      throw new Error(`WebRTC transport is closed: ${transport.id}`);
    }

    await transport.connect({
      dtlsParameters,
    });

    console.log("[WebRTC] Transport connected", {
      transportId: transport.id,
    });
  }

  closeTransport(transport: WebRtcTransport): void {
    transport.close();
  }
}
