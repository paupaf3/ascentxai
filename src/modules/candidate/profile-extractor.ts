import type { RunLogger } from "../../logger";
import { mastra } from "../../mastra";
import {
    candidateProfileSchema,
    type CandidateProfile,
} from "../../types/candidate/profile";
import { parsePdfFromBuffer, parsePdfFromPath } from "./pdf-parser";

export interface ExtractionInputFromPath {
    filePath: string;
}

export interface ExtractionInputFromBuffer {
    buffer: Buffer | Uint8Array;
}

export type ExtractionInput =
    | ExtractionInputFromPath
    | ExtractionInputFromBuffer;

function assertApiKey(): void {
    if (!process.env.NIM_API_KEY) {
        throw new Error(
            "NIM_API_KEY is not set. Add it to your .env file before running extraction."
        );
    }
}

/**
 * End-to-end candidate extraction: PDF -> raw text -> Mastra agent ->
 * validated `CandidateProfile`. Accepts either a filesystem path or an
 * in-memory buffer so the same service powers CLI and HTTP usage.
 */
export async function extractCandidateProfile(
    input: ExtractionInput,
    logger?: RunLogger
): Promise<CandidateProfile> {
    assertApiKey();

    const resumeText =
        "filePath" in input
            ? await parsePdfFromPath(input.filePath)
            : await parsePdfFromBuffer(input.buffer);

    logger?.logData("resumeText", {
        filePath: "filePath" in input ? input.filePath : "<buffer>",
        length: resumeText.length,
        preview: `${resumeText.slice(0, 2000)}${resumeText.length > 2000 ? "..." : ""}`,
    });

    const agent = mastra.getAgent("candidateExtractionAgent");

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const userMessage = [
        `Today's date is ${today}. Use this as the reference date for all date calculations and for determining whether a role is current.`,
        "Extract the candidate profile from the resume text below.",
        "Return strict JSON that matches the provided schema.",
        "---BEGIN RESUME---",
        resumeText,
        "---END RESUME---",
    ].join("\n");

    logger?.logData("candidateExtractionPrompt", {
        content: `${userMessage.slice(0, 2000)}${userMessage.length > 2000 ? "..." : ""}`,
    });

    const result = await agent.generate(
        [{ role: "user", content: userMessage }],
        {
            output: candidateProfileSchema,
        }
    );

    logger?.logData("candidateExtractionRawResponse", result.object);

    return candidateProfileSchema.parse(result.object);
}
