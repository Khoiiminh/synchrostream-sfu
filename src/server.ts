import { createSfuApplication } from './app.js';

const application = createSfuApplication();

await application.start();

const shutdown = async (signal: string) => {
    console.log(`Received ${signal}`);

    await application.shutdown();

    process.exit(0);
};

process.once('SIGINT', () => {
    void shutdown('SIGINT');
});

process.once('SIGTERM', () => {
    void shutdown('SIGTERM');
});