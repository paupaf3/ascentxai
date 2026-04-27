import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';

const DEFAULT_EXTRACTION_MODEL = 'gemini-2.5-flash';
const extractionModel =
    process.env.GOOGLE_GENERATIVE_AI_MODEL?.trim() || DEFAULT_EXTRACTION_MODEL;

/**
 * Mastra agent for extracting structured data from a LinkedIn PDF export.
 *
 * LinkedIn PDFs have a predictable section order (About, Experience, Education,
 * Skills, Recommendations, etc.) but vary in what sections are present.
 * Three extraction requirements drive the instructions below:
 *
 *   1. Endorsed skill counts are social proof — extract them separately from
 *      the aggregated skills taxonomy so downstream prompts can weight them.
 *   2. Recommendations are verbatim text — do not paraphrase.
 *   3. Connection count is often "500+" — normalize to the numeric floor (500).
 */
export const linkedinExtractionAgent = new Agent({
    name: 'linkedin-extraction-agent',
    instructions: [
        'You are an expert data analyst extracting structured data from LinkedIn profile PDF exports.',
        '',
        'GENERAL RULES',
        '- If a section is absent or a field cannot be determined, return null or an empty array. Never invent data.',
        '- Normalize technology and skill names to canonical form: "JavaScript" (not "JS"), "TypeScript" (not "TS"), "PostgreSQL" (not "Postgres"), "Node.js" (not "node"). These names are compared against GitHub language metadata.',
        '- Deduplicate: the same technology must not appear twice under different spellings or casings.',
        '',
        'EXPERIENCE',
        '- Extract every role listed under Experience, ordered most recent first.',
        '- For each role, parse startDate and endDate as YYYY or YYYY-MM. Use the literal string "present" for the current role.',
        '- Use the date provided in the user message as today\'s date for all duration calculations.',
        '- Compute yearsInRole (fractional allowed) from the role\'s own start/end. For active roles, compute up to today.',
        '- Compute totalYearsOfExperience from the NON-OVERLAPPING union of all role periods. Do not sum yearsInRole.',
        '- Populate technologies with canonical skill names explicitly mentioned in each role\'s description.',
        '',
        'SKILLS',
        '- The Skills section on LinkedIn lists skills with optional endorsement counts (e.g. "TypeScript · 42 endorsements").',
        '- Populate endorsedSkills with every skill that appears in this section, including its endorsement count (or null if not shown).',
        '- Also aggregate all skills (from endorsedSkills AND role descriptions) into the skills taxonomy object, bucketed by category.',
        '- topSkills: up to five highest-signal skills, weighted by endorsement count, recency, and seniority of the roles they appear in.',
        '',
        'RECOMMENDATIONS',
        '- Copy recommendation text verbatim. Do not summarize or rephrase.',
        '- recommenderTitle should be the title and company shown below the recommender\'s name (e.g. "Senior Engineer at Acme").',
        '',
        'CONNECTIONS',
        '- LinkedIn shows "500+ connections" — extract the numeric floor (500). If not shown, return null.',
        '',
        'FREE-TEXT FIELDS (headline, summary, role summaries)',
        '- Use the candidate\'s own words as closely as the PDF text allows.',
        '- If the PDF text is garbled due to extraction, reconstruct the most faithful reading.',
    ].join('\n'),
    model: google(extractionModel, { temperature: 0 }),
});
