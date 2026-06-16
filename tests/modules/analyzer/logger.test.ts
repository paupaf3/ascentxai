import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

interface FsCalls {
    mkdirSync: { path: string; options: { recursive: boolean } };
    writeFileSync: { path: string; data: string };
}

const fsCalls: FsCalls[] = [];

vi.mock("node:fs", () => {
    const mkdirSync = vi.fn((path: string, options: { recursive: boolean }) => {
        fsCalls.push({ mkdirSync: { path, options } } as unknown as FsCalls);
    });
    const writeFileSync = vi.fn((path: string, data: string) => {
        fsCalls.push({ writeFileSync: { path, data } } as unknown as FsCalls);
    });
    return {
        default: { mkdirSync, writeFileSync },
        mkdirSync,
        writeFileSync,
    };
});

vi.mock("node:crypto", () => ({
    default: {
        randomBytes: vi.fn(() => Buffer.from([0xde, 0xad, 0xbe, 0xef])),
    },
    randomBytes: vi.fn(() => Buffer.from([0xde, 0xad, 0xbe, 0xef])),
}));

import { RunLogger } from "../../../src/logger";
import type { AnalysisTarget } from "../../../src/types/analysis-target";

const TARGET: AnalysisTarget = { mode: "goal", goal: "Staff Engineer" };

beforeEach(() => {
    fsCalls.length = 0;
});

function lastWrite(): Record<string, unknown> {
    const calls = fsCalls.filter((c) => "writeFileSync" in c);
    const last = calls[calls.length - 1];
    return JSON.parse(
        (last as unknown as { writeFileSync: { data: string } }).writeFileSync
            .data
    );
}

describe("RunLogger", () => {
    it("creates the logs directory on construction", () => {
        const logger = new RunLogger({
            resumePath: "/tmp/test.pdf",
            githubUsername: "testuser",
            target: TARGET,
            linkedinPath: "",
        });

        expect(logger.runId).toBe("deadbeef");
        expect(fsCalls[0]).toMatchObject({
            mkdirSync: { options: { recursive: true } },
        });
    });

    it("writes an initial log file with runId and status running", () => {
        new RunLogger({
            resumePath: "/tmp/test.pdf",
            githubUsername: "testuser",
            target: TARGET,
            linkedinPath: "",
        });

        const log = lastWrite();
        expect(log.runId).toBe("deadbeef");
        expect(log.status).toBe("running");
        expect(log.inputs.resumePath).toBe("/tmp/test.pdf");
        expect(log.inputs.githubUsername).toBe("testuser");
        expect(log.inputs.target).toEqual(TARGET);
    });

    it("exposes runId and logFile through getters", () => {
        const logger = new RunLogger({
            resumePath: "/tmp/resume.pdf",
            githubUsername: "user",
            target: TARGET,
        });

        expect(logger.runId).toBe("deadbeef");
        expect(logger.logFile).toContain("deadbeef.json");
    });

    it("startStage appends a stage and flushes", async () => {
        const logger = new RunLogger({
            resumePath: "/tmp/resume.pdf",
            githubUsername: "user",
            target: TARGET,
        });

        fsCalls.length = 0;
        const stage = logger.startStage("resume_extraction", {
            filePath: "/tmp/resume.pdf",
        });

        expect(stage.name).toBe("resume_extraction");
        expect(stage.status).toBe("running");
        expect(stage.metadata).toEqual({ filePath: "/tmp/resume.pdf" });

        const log = lastWrite();
        expect(log.stages).toHaveLength(1);
        expect(log.stages[0].name).toBe("resume_extraction");
        expect(log.stages[0].status).toBe("running");
    });

    it("endStage sets duration and success status", () => {
        const logger = new RunLogger({
            resumePath: "/tmp/resume.pdf",
            githubUsername: "user",
            target: TARGET,
        });

        const stage = logger.startStage("test_stage");
        fsCalls.length = 0;
        logger.endStage(stage, { extra: "meta" });

        expect(stage.status).toBe("success");
        expect(stage.finishedAt).toBeDefined();
        expect(stage.durationMs).toBeGreaterThanOrEqual(0);
        expect(stage.metadata).toEqual({ extra: "meta" });

        const log = lastWrite();
        expect(log.stages[0].status).toBe("success");
        expect(log.stages[0].durationMs).toBeGreaterThanOrEqual(0);
    });

    it("failStage sets duration and error status", () => {
        const logger = new RunLogger({
            resumePath: "/tmp/resume.pdf",
            githubUsername: "user",
            target: TARGET,
        });

        const stage = logger.startStage("test_stage");
        fsCalls.length = 0;
        logger.failStage(stage, "Something went wrong");

        expect(stage.status).toBe("error");
        expect(stage.error).toBe("Something went wrong");
        expect(stage.durationMs).toBeGreaterThanOrEqual(0);

        const log = lastWrite();
        expect(log.stages[0].status).toBe("error");
        expect(log.stages[0].error).toBe("Something went wrong");
    });

    it("finish sets overall success status and output length", () => {
        const logger = new RunLogger({
            resumePath: "/tmp/resume.pdf",
            githubUsername: "user",
            target: TARGET,
        });

        fsCalls.length = 0;
        logger.finish(500);

        expect(logger["log"].status).toBe("success");
        expect(logger["log"].outputLength).toBe(500);

        const log = lastWrite();
        expect(log.status).toBe("success");
        expect(log.outputLength).toBe(500);
    });

    it("fail sets overall error status and message", () => {
        const logger = new RunLogger({
            resumePath: "/tmp/resume.pdf",
            githubUsername: "user",
            target: TARGET,
        });

        fsCalls.length = 0;
        logger.fail("Fatal error");

        expect(logger["log"].status).toBe("error");
        expect(logger["log"].error).toBe("Fatal error");

        const log = lastWrite();
        expect(log.status).toBe("error");
        expect(log.error).toBe("Fatal error");
    });

    it("records linkedinPath in inputs when provided", () => {
        const logger = new RunLogger({
            resumePath: "/tmp/resume.pdf",
            githubUsername: "user",
            target: TARGET,
            linkedinPath: "/tmp/linkedin.pdf",
        });

        const log = lastWrite();
        expect(log.inputs.linkedinPath).toBe("/tmp/linkedin.pdf");
    });

    it("computes overall durationMs from start to finish", () => {
        const logger = new RunLogger({
            resumePath: "/tmp/resume.pdf",
            githubUsername: "user",
            target: TARGET,
        });

        fsCalls.length = 0;
        logger.finish(100);

        const log = lastWrite();
        expect(log.durationMs).toBeGreaterThanOrEqual(0);
        expect(log.finishedAt).toBeDefined();
    });

    it("handles multiple stages in sequence", () => {
        const logger = new RunLogger({
            resumePath: "/tmp/resume.pdf",
            githubUsername: "user",
            target: TARGET,
        });

        fsCalls.length = 0;
        const s1 = logger.startStage("stage_one");
        const s2 = logger.startStage("stage_two");
        logger.endStage(s1);
        logger.failStage(s2, "failed");

        const log = lastWrite();
        expect(log.stages).toHaveLength(2);
        expect(log.stages[0].name).toBe("stage_one");
        expect(log.stages[0].status).toBe("success");
        expect(log.stages[1].name).toBe("stage_two");
        expect(log.stages[1].status).toBe("error");
        expect(log.stages[1].error).toBe("failed");
    });

    it("flushes (writes) on every state change", () => {
        const logger = new RunLogger({
            resumePath: "/tmp/resume.pdf",
            githubUsername: "user",
            target: TARGET,
        });
        const initialWrites = fsCalls.filter((c) => "writeFileSync" in c).length;

        fsCalls.length = 0;
        logger.startStage("s1");
        const writesAfterStart = fsCalls.filter(
            (c) => "writeFileSync" in c
        ).length;
        expect(writesAfterStart).toBe(1);

        logger.endStage(logger["log"].stages[0]);
        const writesAfterEnd = fsCalls.filter(
            (c) => "writeFileSync" in c
        ).length;
        expect(writesAfterEnd).toBe(2);

        logger.finish(10);
        const writesAfterFinish = fsCalls.filter(
            (c) => "writeFileSync" in c
        ).length;
        expect(writesAfterFinish).toBe(3);
    });
});
