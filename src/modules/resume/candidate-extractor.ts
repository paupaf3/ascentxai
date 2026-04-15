import { mastra } from "../../mastra";
import {
    candidateProfileSchema,
    type CandidateProfile,
} from "../../types/resume/candidate";
import { parseResumeFromBuffer, parseResumeFromPath } from "./pdf-parser";

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
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new Error(
            "GOOGLE_GENERATIVE_AI_API_KEY is not set. Add it to your .env file before running extraction."
        );
    }
}

/**
 * End-to-end candidate extraction: PDF -> raw text -> Mastra agent ->
 * validated `CandidateProfile`. Accepts either a filesystem path or an
 * in-memory buffer so the same service powers CLI and HTTP usage.
 */
export async function extractCandidateProfile(
    input: ExtractionInput
): Promise<CandidateProfile> {
    assertApiKey();

    const resumeText =
        "filePath" in input
            ? await parseResumeFromPath(input.filePath)
            : await parseResumeFromBuffer(input.buffer);

    const agent = mastra.getAgent("candidateExtractionAgent");

    const result = await agent.generate(
        [
            {
                role: "user",
                content: [
                    "Extract the candidate profile from the resume text below.",
                    "Return strict JSON that matches the provided schema.",
                    "---BEGIN RESUME---",
                    resumeText,
                    "---END RESUME---",
                ].join("\n"),
            },
        ],
        {
            output: candidateProfileSchema,
        }
    );

    return candidateProfileSchema.parse(result.object);
}
