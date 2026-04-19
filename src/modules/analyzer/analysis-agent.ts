import { google } from '@ai-sdk/google';
import { Agent } from '@mastra/core/agent';

const DEFAULT_ANALYSIS_MODEL = 'gemini-2.5-flash';
const analysisModel =
    process.env.GOOGLE_GENERATIVE_AI_MODEL?.trim() || DEFAULT_ANALYSIS_MODEL;

/**
 * Mastra agent that produces the career analysis. The full prompt — including
 * system role, candidate profile, GitHub portfolio, goal, and output
 * instructions — is assembled by `prompt-builder.ts` and passed as the user
 * message, so the agent itself carries no domain-specific instructions.
 */
export const careerAnalysisAgent = new Agent({
    name: 'career-analysis-agent',
    instructions: 'You are AscentX Career Architect. Follow the instructions in the user message exactly.',
    model: google(analysisModel),
});
