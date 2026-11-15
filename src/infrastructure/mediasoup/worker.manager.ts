import { Worker } from "mediasoup/types";
import { SfuConfig } from "../../config/sfu.config.js";
import * as mediasoup from 'mediasoup';
import { createLogger } from "../logging/logger.js";

const log = createLogger("WorkerManager");

export class WorkerManager {
    private readonly workers: Worker[] = [];
    private workerFailureCount = 0;

    constructor(
        private readonly config: SfuConfig,
    ) {}

    async start(): Promise<void> {
        if (this.workers.length > 0) {
            return;
        }

        for (let index = 0; index < this.config.mediasoup.workerCount; index++) {
            const worker = await mediasoup.createWorker({
                logLevel: this.config.mediasoup.logLevel,
            });

            worker.on('died', (error) => {
                this.workerFailureCount += 1;

                log.fatal({ err: error }, "mediasoup worker died; exiting");

                process.exit(1);
            });

            this.workers.push(worker);

            log.info({ workerIndex: index, pid: worker.pid }, "mediasoup worker started");
        }
    }

    getWorker(index: number): Worker | undefined {
        return this.workers[index];
    }

    getWorkers(): readonly Worker[] {
        return this.workers;
    }

    getWorkerCount(): number {
        return this.workers.length;
    }

    getWorkerFailureCount(): number {
        return this.workerFailureCount;
    }

    async close(): Promise<void> {
        for (const worker of this.workers) {
            worker.close();
        }

        this.workers.length = 0;
    }
}