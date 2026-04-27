import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";

const DEFAULT_EXTRACTION_MODEL = "gemini-2.5-flash";
const extractionModel =
    process.env.GOOGLE_GENERATIVE_AI_MODEL?.trim() || DEFAULT_EXTRACTION_MODEL;

/**
 * Mastra agent responsible for extracting a rich, structured candidate
 * profile from a raw resume text blob.
 *
 * The agent is tuned for AscentX's downstream use case: cross-referencing
 * the resume against a GitHub portfolio and a career goal. That drives
 * three non-obvious requirements in the instructions below:
 *
 *   1. Per-role technology lists (not just a global skill blob) so we can
 *      correlate each role with the repositories active in that period.
 *   2. Canonical skill names that line up with GitHub's `primaryLanguage`
 *      field (e.g. always "JavaScript", never "JS").
 *   3. Duration per role AND a deduplicated, non-overlapping total — these
 *      are different numbers and we need both.
 *
 * Model: configurable via `GOOGLE_GENERATIVE_AI_MODEL` (defaults to
 * `gemini-2.5-flash`) to remain compatible as Google model IDs evolve.
 */
export const candidateExtractionAgent = new Agent({
    name: "candidate-extraction-agent",
    instructions: [
        "You are an expert HR data analyst extracting structured data from resumes.",
        "",
        "GENERAL RULES",
        "- If information is missing, return null for that specific field. Never invent data.",
        '- Normalize technology names to their canonical form: "JavaScript" (not "JS"), "TypeScript" (not "TS"), "PostgreSQL" (not "Postgres" or "psql"), "Node.js" (not "node"). These names are compared directly against GitHub language metadata, so consistency matters.',
        "- Deduplicate: the same technology should not appear twice under different casings or spellings.",
        "",
        "EXPERIENCE",
        "- Extract every professional role you can identify, ordered most recent first.",
        '- For each role, fill startDate and endDate as YYYY or YYYY-MM. Use the literal string "present" for roles that are still active as of the date provided in the user message.',
        "- Use the date provided in the user message as today's date for all calculations. Do not use your training cutoff or any assumed date.",
        "- Compute yearsInRole for each role as a number (fractional allowed, e.g. 1.5) from its own start/end dates. For current roles, compute up to today's date.",
        "- Compute totalYearsOfExperience as the sum of NON-OVERLAPPING role periods up to today's date. If two roles overlap, count the overlap only once. Do not simply add yearsInRole together.",
        "- For each role, populate technologies with the canonical names of languages, frameworks, and tools explicitly mentioned for that role.",
        "",
        "FREE-TEXT FIELDS (headline, summary, roles[].summary)",
        "- Use the candidate's own words as closely as the extracted text allows.",
        "- Do not rephrase, embellish, or add information not present in the resume.",
        "- If the source text is fragmented or garbled due to PDF extraction, reconstruct the most faithful reading you can — but still prefer the candidate's vocabulary and sentence structure over your own.",
        "",
        "SKILLS",
        "- Aggregate all technologies mentioned anywhere in the resume into the skills object, bucketed by category (languages / frameworks / databases / cloudAndInfra / tools / other).",
        "- topSkills is a ranked shortlist of at most five highest-signal skills: weight by frequency across roles, recency, and seniority of the role they appear in.",
        "",
        "LINKS",
        '- Scan the full document (header, footer, contact block, project descriptions) for GitHub, LinkedIn, and personal-site URLs. A bare GitHub username like "github.com/foo" or "@foo" on a contact line counts.',
    ].join("\n"),
    model: google(extractionModel, { temperature: 0 }),
});
