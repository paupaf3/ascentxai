import { mastra } from '../../mastra';
import type { LinkedInProfile } from '../../types/linkedin/linkedin-profile';
import { extractCandidateProfile } from '../candidate/profile-extractor';
import { fetchProfile } from '../github/github-client';
import { extractLinkedInProfile } from '../linkedin/profile-extractor';
import { buildPrompt } from './prompt-builder';

/**
 * End-to-end career analysis orchestrator.
 *
 * Chains independent modules in parallel and returns the raw AI-generated
 * analysis string. LinkedIn is optional: when a path is supplied it is
 * extracted alongside the resume and GitHub; when omitted the analysis
 * falls back to two data sources.
 */
export async function analyze(
    resumePath: string,
    githubUsername: string,
    goal: string,
    linkedinPath?: string,
): Promise<string> {
    const linkedinPromise: Promise<LinkedInProfile | null> = linkedinPath
        ? extractLinkedInProfile({ filePath: linkedinPath })
        : Promise.resolve(null);

    const [profile, portfolio, linkedinProfile] = await Promise.all([
        extractCandidateProfile({ filePath: resumePath }),
        fetchProfile(githubUsername),
        linkedinPromise,
    ]);

    const prompt = buildPrompt(profile, portfolio, goal, linkedinProfile);

    const agent = mastra.getAgent('careerAnalysisAgent');
    const result = await agent.generate([{ role: 'user', content: prompt }]);

    if (!result.text) {
        throw new Error('Career analysis agent returned an empty response.');
    }

    return result.text;
}
