import "dotenv/config";
import { createRequire } from "node:module";
import { pino, stdSerializers, type Logger, type LoggerOptions } from "pino";

/**
 * Shared SFU logger (pino). One JSON line per event:
 *
 *   { level, time, service, nodeId, context, msg, ...fields, err? }
 *
 * Use `createLogger("ComponentName")` once per module and pass ids as fields,
 * e.g. `log.info({ mediaSessionId, participantId }, "Participant added")`.
 *
 * Environment:
 *   LOG_LEVEL   trace | debug | info | warn | error | fatal | silent
 *               (default: "info" when NODE_ENV=production, otherwise "debug")
 *   LOG_FORMAT  json | pretty (default: "json" in production, otherwise "pretty"
 *               when pino-pretty is installed)
 * mediasoup's own worker logging stays controlled by MEDIASOUP_LOG_LEVEL.
 */

export type { Logger };

const isProduction = process.env.NODE_ENV === "production";

function prettyTransportAvailable(): boolean {
  try {
    createRequire(import.meta.url).resolve("pino-pretty");
    return true;
  } catch {
    return false;
  }
}

function buildOptions(): LoggerOptions {
  const format = process.env.LOG_FORMAT ?? (isProduction ? "json" : "pretty");
  const options: LoggerOptions = {
    level: process.env.LOG_LEVEL ?? (isProduction ? "info" : "debug"),
    base: { service: "synchrostream-sfu", nodeId: process.env.SFU_NODE_ID },
    timestamp: pino.stdTimeFunctions.isoTime,
    serializers: { err: stdSerializers.err, error: stdSerializers.err },
    redact: {
      paths: ["token", "*.token", "authorization", "*.authorization", "secret", "*.secret"],
      censor: "[redacted]",
    },
  };
  if (format === "pretty" && prettyTransportAvailable()) {
    options.transport = {
      target: "pino-pretty",
      options: { translateTime: "SYS:HH:MM:ss.l", ignore: "pid,hostname,service" },
    };
  }
  return options;
}

export const rootLogger: Logger = pino(buildOptions());

export function createLogger(context: string): Logger {
  return rootLogger.child({ context });
}
