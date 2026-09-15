import { Worker } from "mediasoup/types";
import { SfuConfig } from "../../config/sfu.config.js";
import * as mediasoup from 'mediasoup';

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

                console.error(
                    `[SFU:${this.config.nodeId}] mediasoup worker died`,
                    error,
                );

                process.exit(1);
            });

            this.workers.push(worker);

            console.log(
                `[SFU:${this.config.nodeId}] Worker started`,
                {
                    workerIndex: index,
                    pid: worker.pid,
                },
            );
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