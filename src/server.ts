import { createSfuApplication } from './app.js';
import { createLogger } from "./infrastructure/logging/logger.js";

const log = createLogger("Process");

const application = createSfuApplication();

await application.start();

const shutdown = async (signal: string) => {
    log.info({ signal }, "Received shutdown signal");

    await application.shutdown();

    process.exit(0);
};

process.once('SIGINT', () => {
    void shutdown('SIGINT');
});

process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
});