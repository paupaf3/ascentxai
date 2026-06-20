import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const { generateMock, getAgentMock } = vi.hoisted(() => {
    const generate = vi.fn();
    return {
        generateMock: generate,
        getAgentMock: vi.fn(() => ({ generate })),
    };
});

vi.mock("../../../src/mastra", () => ({
    mastra: { getAgent: getAgentMock },
}));

import { extractJobDescription } from "../../../src/modules/job/job-extractor";
import type { JobDescription } from "../../../src/types/job/job-description";

const validJobOutput: JobDescription = {
    title: "Senior Engineer",
    company: "Acme",
    seniorityLevel: "senior",
    minYearsExperience: 5,
    requiredSkills: ["TypeScript", "AWS"],
    preferredSkills: ["Python"],
    responsibilities: ["Build and maintain APIs"],
    domain: "fintech",
};

const ORIGINAL_KEY = process.env.NIM_API_KEY;

beforeEach(() => {
    vi.clearAllMocks();
    process.env.NIM_API_KEY = "test-key";
    generateMock.mockResolvedValue({ object: validJobOutput });
});

afterEach(() => {
    if (ORIGINAL_KEY === undefined) {
        delete process.env.NIM_API_KEY;
    } else {
        process.env.NIM_API_KEY = ORIGINAL_KEY;
    }
});

describe("extractJobDescription", () => {
    it("throws a descriptive error when the API key is missing", async () => {
        delete process.env.NIM_API_KEY;

        await expect(extractJobDescription("some job text")).rejects.toThrow(
            /NIM_API_KEY/
        );

        expect(generateMock).not.toHaveBeenCalled();
    });

    it("passes plain text directly to the agent without calling fetch", async () => {
        const mockFetch = vi.fn();
        vi.stubGlobal("fetch", mockFetch);

        const result = await extractJobDescription(
            "We are looking for a Senior Engineer with TypeScript and AWS"
        );

        expect(mockFetch).not.toHaveBeenCalled();
        expect(getAgentMock).toHaveBeenCalledWith("jobExtractionAgent");
        expect(result).toEqual(validJobOutput);
    });

    it("passes URL input to fetch via Jina proxy", async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () =>
                Promise.resolve(
                    "Senior Engineer\nBuild APIs with TypeScript"
                ),
        });
        vi.stubGlobal("fetch", mockFetch);

        const result = await extractJobDescription(
            "https://example.com/jobs/123"
        );

        expect(mockFetch).toHaveBeenCalledWith(
            "https://r.jina.ai/https://example.com/jobs/123",
            expect.objectContaining({
                headers: expect.anything(),
                signal: expect.any(AbortSignal),
            })
        );
        expect(result).toEqual(validJobOutput);
    });

    it("re-validates the agent output with Zod and rejects malformed responses", async () => {
        vi.stubGlobal("fetch", vi.fn());
        generateMock.mockResolvedValueOnce({
            object: {
                ...validJobOutput,
                seniorityLevel: "über-senior",
            },
        });

        await expect(extractJobDescription("some job")).rejects.toThrow();
    });

    it("detects http:// URLs", async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve("Senior Engineer needed"),
        });
        vi.stubGlobal("fetch", mockFetch);

        await extractJobDescription("http://example.com/job");

        expect(mockFetch).toHaveBeenCalledWith(
            "https://r.jina.ai/http://example.com/job",
            expect.objectContaining({
                headers: expect.anything(),
                signal: expect.any(AbortSignal),
            })
        );
    });

    it("detects https:// URLs", async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve("Senior Engineer needed"),
        });
        vi.stubGlobal("fetch", mockFetch);

        await extractJobDescription("https://careers.example.com/posting/42");

        expect(mockFetch).toHaveBeenCalledWith(
            "https://r.jina.ai/https://careers.example.com/posting/42",
            expect.objectContaining({
                headers: expect.anything(),
                signal: expect.any(AbortSignal),
            })
        );
    });

    it("passes Jina markdown content directly to the agent", async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: true,
            text: () => Promise.resolve("Hello World Test"),
        });
        vi.stubGlobal("fetch", mockFetch);

        await extractJobDescription("https://example.com/job");

        const messages = generateMock.mock.calls[0][0];
        expect(messages[0].content).toContain("Hello World Test");
    });

    it("throws when Jina returns a non-ok HTTP response", async () => {
        const mockFetch = vi.fn().mockResolvedValue({
            ok: false,
            status: 404,
            text: () => Promise.resolve("Not Found"),
        });
        vi.stubGlobal("fetch", mockFetch);

        await expect(
            extractJobDescription("https://example.com/missing")
        ).rejects.toThrow(/Jina returned HTTP 404/);
    });

    it("includes the job posting text between BEGIN/END markers", async () => {
        vi.stubGlobal("fetch", vi.fn());

        await extractJobDescription("Senior TypeScript developer needed");

        const messages = generateMock.mock.calls[0][0];
        expect(messages[0].content).toContain("---BEGIN JOB POSTING---");
        expect(messages[0].content).toContain("---END JOB POSTING---");
    });

    it("throws on a URL with unresolvable host (network error)", async () => {
        const mockFetch = vi
            .fn()
            .mockRejectedValue(new Error("fetch failed: ENOTFOUND"));
        vi.stubGlobal("fetch", mockFetch);

        await expect(
            extractJobDescription("https://nonexistent.example.com/job")
        ).rejects.toThrow(/ENOTFOUND/);
    });
});
