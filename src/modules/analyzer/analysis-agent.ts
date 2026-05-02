import { google } from "@ai-sdk/google";
import { Agent } from "@mastra/core/agent";

import { fetchGithubRepoTool, fetchTopGithubReposTool } from "./tools";

const DEFAULT_ANALYSIS_MODEL = "gemini-2.5-flash";
const analysisModel =
    process.env.GOOGLE_GENERATIVE_AI_MODEL?.trim() || DEFAULT_ANALYSIS_MODEL;

/**
 * Mastra agent that produces the career analysis.
 *
 * The full prompt — including system role, candidate profile, GitHub
 * portfolio, optional LinkedIn data, goal, and output instructions — is
 * assembled by `prompt-builder.ts` and passed as the user message.
 *
 * The agent has two optional tools it can call mid-reasoning when the
 * initial context is not enough:
 *
 *   - fetch_github_repo: fetch a specific repo by "owner/repo" slug. Use
 *     when the resume or LinkedIn mentions a project that is not among the
 *     pinned repos already provided.
 *   - fetch_top_github_repos: fetch the candidate's top public repos by
 *     stars. Use when the pinned repos seem unrepresentative — e.g. a
 *     senior candidate with very few pins, or pins whose languages don't
 *     match claimed skills.
 *
 * Tools are a last resort. If the provided context is sufficient to produce
 * a high-quality analysis, the agent must not call any tools.
 */
export const careerAnalysisAgent = new Agent({
    name: "career-analysis-agent",
    instructions: [
        "You are AscentX Career Architect. Follow the instructions in the user message exactly.",
        "",
        "TOOLS — use only when the provided context is clearly insufficient:",
        "- fetch_github_repo: call this when a specific repository is mentioned in the resume or LinkedIn but is not present in the GitHub portfolio data already provided. Pass the full 'owner/repo' slug.",
        "- fetch_top_github_repos: call this when the pinned repos seem unrepresentative of the candidate's experience (e.g. a senior engineer with only one or two pinned repos, or pinned repos in languages unrelated to their claimed skills). Pass the GitHub username from the portfolio section.",
        "Do not call tools speculatively or to confirm information already present. If the provided context is sufficient, produce the analysis directly without any tool calls.",
    ].join("\n"),
    model: google(analysisModel, { temperature: 0 }),
    tools: {
        fetch_github_repo: fetchGithubRepoTool,
        fetch_top_github_repos: fetchTopGithubReposTool,
    },
});
