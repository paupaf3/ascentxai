import { graphql } from "@octokit/graphql";
import { GraphqlResponseError } from "@octokit/graphql";
import {
    GithubRawProfileResponse,
    GithubRawSingleRepoResponse,
} from "../../types/github/github-response";
import { PROFILE_AND_PINNED_QUERY, SINGLE_REPO_QUERY } from "./github-queries";
import { GithubProfile, GithubRepo } from "../../types/github/github";
import { mapRepo } from "./github-mapper";

// ---------------------------------------------------------------------------
//
// ---------------------------------------------------------------------------

/**
 * GraphQL client factory.
 * Requires a GITHUB_TOKEN in the environment — the GitHub GraphQL API does
 * not allow unauthenticated requests.
 */
function buildClient() {
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        throw new Error(
            "Missing GITHUB_TOKEN environment variable. " +
                "Generate one at https://github.com/settings/tokens and add it to your .env file."
        );
    }
    return graphql.defaults({
        headers: { authorization: `token ${token}` },
    });
}

/**
 * Fetches the GitHub profile and pinned repositories for a given username.
 */
export async function fetchProfile(username: string): Promise<GithubProfile> {
    const client = buildClient();

    let response: GithubRawProfileResponse;

    try {
        response = await client<GithubRawProfileResponse>(
            PROFILE_AND_PINNED_QUERY,
            {
                username,
            }
        );
    } catch (error) {
        if (error instanceof GraphqlResponseError) {
            throw new Error(
                `GitHub API error for user "${username}": ${error.message}`
            );
        }
        throw error;
    }

    if (!response.user) {
        throw new Error(
            `GitHub user "${username}" not found. Check the username and try again.`
        );
    }

    const { user } = response;

    return {
        username,
        name: user.name,
        bio: user.bio,
        location: user.location,
        company: user.company,
        websiteUrl: user.websiteUrl,
        avatarUrl: user.avatarUrl,
        followers: user.followers.totalCount,
        following: user.following.totalCount,
        pinnedRepos: user.pinnedItems.nodes.map(mapRepo),
    };
}

/**
 * Fetches detailed information for a single repository specified by the user.
 * Accepts either "owner/repo" format or separate owner + repo strings.
 */
export async function fetchRepo(
    owner: string,
    repo: string
): Promise<GithubRepo> {
    const client = buildClient();

    let response: GithubRawSingleRepoResponse;

    try {
        response = await client<GithubRawSingleRepoResponse>(
            SINGLE_REPO_QUERY,
            {
                owner,
                repo,
            }
        );
    } catch (error) {
        if (error instanceof GraphqlResponseError) {
            throw new Error(
                `GitHub API error for repo "${owner}/${repo}": ${error.message}`
            );
        }
        throw error;
    }

    if (!response.repository) {
        throw new Error(
            `Repository "${owner}/${repo}" not found or is private.`
        );
    }

    return mapRepo(response.repository);
}

/**
 * Parses a "owner/repo" string and calls fetchRepo.
 * Convenience wrapper for CLI input like "vercel/next.js".
 */
export async function fetchRepoBySlug(slug: string): Promise<GithubRepo> {
    const parts = slug.trim().split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
        throw new Error(
            `Invalid repository slug "${slug}". Expected format: "owner/repo".`
        );
    }
    return fetchRepo(parts[0], parts[1]);
}
