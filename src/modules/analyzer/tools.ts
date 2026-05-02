import { createTool } from "@mastra/core/tools";
import { z } from "zod";

import { githubRepoSchema } from "../../types/github/github";
import { fetchRepoBySlug, fetchTopRepositories } from "../github/github-client";

/**
 * Analysis agent tools — optional enrichment calls the agent can make when
 * the initial context assembled by the orchestrator is not sufficient.
 *
 * Design principles:
 *   - Tools are read-only. They never mutate state.
 *   - Tools reuse the existing GitHub client functions — no new networking
 *     logic lives here.
 *   - Tools are a last resort. The agent instructions explicitly tell it to
 *     use the provided context first and only call tools when there is a
 *     clear signal that more data would materially improve the analysis.
 */

/**
 * Fetches full details (including README) for a single GitHub repository.
 *
 * Use case: the resume or LinkedIn mentions a project that is not among the
 * pinned repos already in the context. This tool lets the agent verify
 * whether that project exists and inspect its README before drawing
 * conclusions about the candidate's actual skill depth.
 */
export const fetchGithubRepoTool = createTool({
    id: "fetch_github_repo",
    description:
        "Fetch full details and README for a specific GitHub repository. " +
        "Use this when a repository is mentioned in the resume or LinkedIn " +
        "but is not present in the pinned repos already provided. " +
        'Input must be an "owner/repo" slug (e.g. "vercel/next.js").',
    inputSchema: z.object({
        slug: z
            .string()
            .describe(
                'Repository slug in "owner/repo" format, e.g. "torvalds/linux".'
            ),
    }),
    outputSchema: githubRepoSchema,
    execute: async ({ context }) => {
        return fetchRepoBySlug(context.slug);
    },
});

/**
 * Fetches the top public, non-forked repositories for a GitHub user ordered
 * by star count.
 *
 * Use case: the pinned repos feel unrepresentative of the candidate's
 * experience — e.g. a senior engineer with only one or two pinned repos, or
 * pinned repos whose languages do not match the skills claimed in the resume.
 * This tool surfaces what the candidate has actually shipped publicly.
 */
export const fetchTopGithubReposTool = createTool({
    id: "fetch_top_github_repos",
    description:
        "Fetch the top public repositories for a GitHub user, ordered by stars. " +
        "Use this when the pinned repos already provided seem unrepresentative " +
        "(e.g. few pinned repos relative to years of experience, or languages " +
        "that do not match the resume). Defaults to 10 repos.",
    inputSchema: z.object({
        username: z
            .string()
            .describe("GitHub username to fetch repositories for."),
        limit: z
            .number()
            .int()
            .min(1)
            .max(20)
            .optional()
            .describe(
                "Maximum number of repositories to return (default 10, max 20)."
            ),
    }),
    outputSchema: z.array(githubRepoSchema),
    execute: async ({ context }) => {
        return fetchTopRepositories(context.username, context.limit ?? 10);
    },
});
