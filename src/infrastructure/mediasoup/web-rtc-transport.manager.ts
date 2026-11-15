import {
  DtlsParameters,
  Router,
  WebRtcServer,
  WebRtcTransport,
} from "mediasoup/types";
import { WebRtcTransportOptions } from "../../application/transport/web-rtc-transport.types.js";
import { createLogger } from "../logging/logger.js";

const log = createLogger("WebRtcTransportManager");

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
      log.debug({ transportId: transport.id, iceState }, "ICE state changed");
    });

    transport.on("iceselectedtuplechange", (iceSelectedTuple) => {
      log.debug({ transportId: transport.id, iceSelectedTuple }, "ICE selected tuple changed");
    });

    transport.on("dtlsstatechange", (dtlsState) => {
      log.debug({ transportId: transport.id, dtlsState }, "DTLS state changed");
    });

    transport.on("@close", () => {
      log.debug({ transportId: transport.id }, "Transport closed");
    });

    log.debug({ transportId: transport.id, routerId: router.id }, "Transport created");

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

    log.debug({ transportId: transport.id }, "Transport connected");
  }

  closeTransport(transport: WebRtcTransport): void {
    transport.close();
  }
}
