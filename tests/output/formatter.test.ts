import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "../../src/output/formatter";

describe("render", () => {
    let stdoutWrite: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        stdoutWrite = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    });

    afterEach(() => {
        stdoutWrite.mockRestore();
    });

    it("prints a top border, tool header, and bottom border", () => {
        render("Hello world");

        const calls = stdoutWrite.mock.calls.map((c: unknown[]) => c[0] as string);
        const output = calls.join("");
        expect(output).toContain("━".repeat(60));
        expect(output).toContain("AscentX Career Architect");
        expect(output).toContain("Run at:");
    });

    it("includes the analysis content", () => {
        render("This is the analysis content.");

        const calls = stdoutWrite.mock.calls.map((c: unknown[]) => c[0] as string);
        const output = calls.join("");
        expect(output).toContain("This is the analysis content.");
    });

    it("includes a run ID when provided", () => {
        render("Analysis", { runId: "abc123" });

        const calls = stdoutWrite.mock.calls.map((c: unknown[]) => c[0] as string);
        const output = calls.join("");
        expect(output).toContain("Run ID: abc123");
    });

    it("omits the run ID line when not provided", () => {
        render("Analysis");

        const calls = stdoutWrite.mock.calls.map((c: unknown[]) => c[0] as string);
        const output = calls.join("");
        expect(output).not.toContain("Run ID:");
    });

    it("writes to process.stdout", () => {
        render("test");

        expect(stdoutWrite).toHaveBeenCalled();
    });
});
