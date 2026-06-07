import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

import type { AnalysisTarget } from "./types/analysis-target";

const LOGS_DIR = path.resolve(process.cwd(), "logs");

export interface StageLog {
    name: string;
    startedAt: string;
    finishedAt?: string;
    durationMs?: number;
    status: "running" | "success" | "error";
    metadata?: Record<string, unknown>;
    error?: string;
}

interface RunLog {
    runId: string;
    startedAt: string;
    finishedAt?: string;
    durationMs?: number;
    status: "running" | "success" | "error";
    inputs: {
        resumePath: string;
        githubUsername: string;
        target: AnalysisTarget;
        linkedinPath?: string;
    };
    stages: StageLog[];
    outputLength?: number;
    error?: string;
}

export class RunLogger {
    private log: RunLog;
    private filePath: string;

    constructor(inputs: RunLog["inputs"]) {
        const runId = crypto.randomBytes(4).toString("hex");
        const ts = new Date().toISOString();
        const fileTs = ts.slice(0, 19).replace(/:/g, "-");

        this.log = {
            runId,
            startedAt: ts,
            status: "running",
            inputs,
            stages: [],
        };

        fs.mkdirSync(LOGS_DIR, { recursive: true });
        this.filePath = path.join(LOGS_DIR, `${fileTs}_${runId}.json`);
        this.flush();
    }

    get runId(): string {
        return this.log.runId;
    }

    get logFile(): string {
        return this.filePath;
    }

    startStage(name: string, metadata?: Record<string, unknown>): StageLog {
        const stage: StageLog = {
            name,
            startedAt: new Date().toISOString(),
            status: "running",
            ...(metadata && { metadata }),
        };
        this.log.stages.push(stage);
        this.flush();
        return stage;
    }

    endStage(stage: StageLog, metadata?: Record<string, unknown>): void {
        const now = new Date().toISOString();
        stage.finishedAt = now;
        stage.durationMs =
            Date.parse(now) - Date.parse(stage.startedAt);
        stage.status = "success";
        if (metadata) stage.metadata = { ...stage.metadata, ...metadata };
        this.flush();
    }

    failStage(stage: StageLog, error: string): void {
        const now = new Date().toISOString();
        stage.finishedAt = now;
        stage.durationMs =
            Date.parse(now) - Date.parse(stage.startedAt);
        stage.status = "error";
        stage.error = error;
        this.flush();
    }

    finish(outputLength: number): void {
        const now = new Date().toISOString();
        this.log.finishedAt = now;
        this.log.durationMs = Date.parse(now) - Date.parse(this.log.startedAt);
        this.log.status = "success";
        this.log.outputLength = outputLength;
        this.flush();
    }

    fail(error: string): void {
        const now = new Date().toISOString();
        this.log.finishedAt = now;
        this.log.durationMs = Date.parse(now) - Date.parse(this.log.startedAt);
        this.log.status = "error";
        this.log.error = error;
        this.flush();
    }

    private flush(): void {
        fs.writeFileSync(this.filePath, JSON.stringify(this.log, null, 2));
    }
}
