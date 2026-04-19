import { mastra } from '../../mastra';
import { extractCandidateProfile } from '../candidate/profile-extractor';
import { fetchProfile } from '../github/github-client';
import { buildPrompt } from './prompt-builder';

/**
 * End-to-end career analysis orchestrator.
 *
 * Chains the four independent modules in sequence and returns the raw
 * AI-generated analysis string. No formatting or rendering logic lives here —
 * that is delegated to `formatter.ts`.
 */
export async function analyze(
    resumePath: string,
    githubUsername: string,
    goal: string,
): Promise<string> {
    const [profile, portfolio] = await Promise.all([
        extractCandidateProfile({ filePath: resumePath }),
        fetchProfile(githubUsername),
    ]);

    const prompt = buildPrompt(profile, portfolio, goal);

    const agent = mastra.getAgent('careerAnalysisAgent');
    const result = await agent.generate([{ role: 'user', content: prompt }]);

    if (!result.text) {
        throw new Error('Career analysis agent returned an empty response.');
    }

    return result.text;
}
