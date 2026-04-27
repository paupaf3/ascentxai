import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { fullLinkedInFixture } from "./fixtures/profile.fixture";

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

vi.mock("../../../src/modules/candidate/pdf-parser", () => ({
    parsePdfFromPath: vi.fn(),
    parsePdfFromBuffer: vi.fn(),
}));

import {
    parsePdfFromBuffer,
    parsePdfFromPath,
} from "../../../src/modules/candidate/pdf-parser";
import { extractLinkedInProfile } from "../../../src/modules/linkedin/profile-extractor";

const mockedParsePath = parsePdfFromPath as unknown as ReturnType<typeof vi.fn>;
const mockedParseBuffer = parsePdfFromBuffer as unknown as ReturnType<typeof vi.fn>;

const ORIGINAL_KEY = process.env.GOOGLE_GENERATIVE_AI_API_KEY;

beforeEach(() => {
    vi.clearAllMocks();
    process.env.GOOGLE_GENERATIVE_AI_API_KEY = "test-key";
    generateMock.mockResolvedValue({ object: fullLinkedInFixture });
});

afterEach(() => {
    if (ORIGINAL_KEY === undefined) {
        delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    } else {
        process.env.GOOGLE_GENERATIVE_AI_API_KEY = ORIGINAL_KEY;
    }
});

describe("extractLinkedInProfile", () => {
    it("parses a PDF path, invokes the agent, and returns a validated profile", async () => {
        mockedParsePath.mockResolvedValueOnce("RAW LINKEDIN TEXT");

        const profile = await extractLinkedInProfile({
            filePath: "/tmp/linkedin.pdf",
        });

        expect(mockedParsePath).toHaveBeenCalledWith("/tmp/linkedin.pdf");
        expect(getAgentMock).toHaveBeenCalledWith("linkedinExtractionAgent");

        const messages = generateMock.mock.calls[0]?.[0];
        const options = generateMock.mock.calls[0]?.[1];

        expect(options.output).toBeDefined();
        expect(messages[0].content).toContain("RAW LINKEDIN TEXT");

        expect(profile.fullName).toBe("Ada Lovelace");
        expect(profile.roles).toHaveLength(2);
        expect(profile.roles[0]?.technologies).toContain("TypeScript");
        expect(profile.endorsedSkills[0]?.name).toBe("TypeScript");
        expect(profile.endorsedSkills[0]?.endorsements).toBe(42);
    });

    it("supports buffer input (no disk access)", async () => {
        mockedParseBuffer.mockResolvedValueOnce("BUFFER TEXT");

        const profile = await extractLinkedInProfile({
            buffer: Buffer.from("pdf-bytes"),
        });

        expect(mockedParseBuffer).toHaveBeenCalled();
        expect(mockedParsePath).not.toHaveBeenCalled();
        expect(profile.fullName).toBe("Ada Lovelace");
    });

    it("throws a descriptive error when the API key is missing", async () => {
        delete process.env.GOOGLE_GENERATIVE_AI_API_KEY;

        await expect(
            extractLinkedInProfile({ filePath: "/tmp/linkedin.pdf" })
        ).rejects.toThrow(/GOOGLE_GENERATIVE_AI_API_KEY/);

        expect(mockedParsePath).not.toHaveBeenCalled();
        expect(generateMock).not.toHaveBeenCalled();
    });

    it("re-validates the agent output with Zod and rejects malformed responses", async () => {
        mockedParsePath.mockResolvedValueOnce("RAW");
        generateMock.mockResolvedValueOnce({
            object: {
                ...fullLinkedInFixture,
                topSkills: ["a", "b", "c", "d", "e", "f"], // exceeds max(5)
            },
        });

        await expect(
            extractLinkedInProfile({ filePath: "/tmp/linkedin.pdf" })
        ).rejects.toThrow();
    });

    it("injects today's date into the prompt", async () => {
        mockedParsePath.mockResolvedValueOnce("RAW LINKEDIN TEXT");

        await extractLinkedInProfile({ filePath: "/tmp/linkedin.pdf" });

        const messages = generateMock.mock.calls[0]?.[0];
        const today = new Date().toISOString().slice(0, 10);
        expect(messages[0].content).toContain(today);
    });
});
