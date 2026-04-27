import { mastra } from '../../mastra';
import { linkedinProfileSchema, type LinkedInProfile } from '../../types/linkedin/linkedin-profile';
import { parsePdfFromBuffer, parsePdfFromPath } from '../candidate/pdf-parser';

export interface LinkedInExtractionInputFromPath {
    filePath: string;
}

export interface LinkedInExtractionInputFromBuffer {
    buffer: Buffer | Uint8Array;
}

export type LinkedInExtractionInput =
    | LinkedInExtractionInputFromPath
    | LinkedInExtractionInputFromBuffer;

function assertApiKey(): void {
    if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
        throw new Error(
            'GOOGLE_GENERATIVE_AI_API_KEY is not set. Add it to your .env file before running extraction.',
        );
    }
}

/**
 * End-to-end LinkedIn extraction: PDF → raw text → Mastra agent →
 * validated LinkedInProfile. Reuses the generic pdf-parser since the
 * LinkedIn PDF export is a standard PDF — only the prompt and schema differ.
 */
export async function extractLinkedInProfile(
    input: LinkedInExtractionInput,
): Promise<LinkedInProfile> {
    assertApiKey();

    const pdfText =
        'filePath' in input
            ? await parsePdfFromPath(input.filePath)
            : await parsePdfFromBuffer(input.buffer);

    const agent = mastra.getAgent('linkedinExtractionAgent');

    const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

    const result = await agent.generate(
        [
            {
                role: 'user',
                content: [
                    `Today's date is ${today}. Use this as the reference date for all date calculations and for determining whether a role is current.`,
                    'Extract the LinkedIn profile data from the PDF text below.',
                    'Return strict JSON that matches the provided schema.',
                    '---BEGIN LINKEDIN PDF---',
                    pdfText,
                    '---END LINKEDIN PDF---',
                ].join('\n'),
            },
        ],
        {
            output: linkedinProfileSchema,
        },
    );

    return linkedinProfileSchema.parse(result.object);
}
