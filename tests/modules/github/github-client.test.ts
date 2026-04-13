import { describe, it, expect, vi, beforeEach } from "vitest";
import { GraphqlResponseError } from "@octokit/graphql";

// Mock @octokit/graphql before importing the module under test
vi.mock("@octokit/graphql", async (importOriginal) => {
    const actual = await importOriginal<typeof import("@octokit/graphql")>();
    return {
        ...actual,
        graphql: {
            defaults: vi.fn().mockReturnValue(vi.fn()),
        },
    };
});

import { graphql } from "@octokit/graphql";
import {
    fetchProfile,
    fetchRepoBySlug,
    fetchRepo,
} from "../../../src/modules/github/github-client";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockClient = vi.fn();

beforeEach(() => {
    vi.clearAllMocks();
    (graphql.defaults as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);
});

// ---------------------------------------------------------------------------
// fetchProfile
// ---------------------------------------------------------------------------

describe("fetchProfile", () => {
    it("returns a fully mapped GithubProfile when the user exists", async () => {
        mockClient.mockResolvedValueOnce({
            user: {
                name: "Test User",
                bio: "A software engineer",
                location: "Barcelona",
                company: "Acme Corp",
                websiteUrl: "https://testuser.dev",
                avatarUrl: "https://avatars.githubusercontent.com/u/123456",
                followers: { totalCount: 100 },
                following: { totalCount: 50 },
                pinnedItems: {
                    nodes: [
                        {
                            name: "awesome-project",
                            description: "A test repository",
                            url: "https://github.com/testuser/awesome-project",
                            primaryLanguage: { name: "TypeScript" },
                            object: { text: "# Awesome Project" },
                        },
                    ],
                },
            },
        });

        const profile = await fetchProfile("testuser");

        expect(profile.username).toBe("testuser");
        expect(profile.name).toBe("Test User");
        expect(profile.bio).toBe("A software engineer");
        expect(profile.followers).toBe(100);
        expect(profile.pinnedRepos).toHaveLength(1);
        expect(profile.pinnedRepos[0]?.name).toBe("awesome-project");
        expect(profile.pinnedRepos[0]?.primaryLanguage).toBe("TypeScript");
        expect(profile.pinnedRepos[0]?.readme).toBe("# Awesome Project");
    });

    it("maps null fields correctly when optional profile data is missing", async () => {
        mockClient.mockResolvedValueOnce({
            user: {
                name: null,
                bio: null,
                location: null,
                company: null,
                websiteUrl: null,
                avatarUrl: "https://avatars.githubusercontent.com/u/123456",
                followers: { totalCount: 0 },
                following: { totalCount: 0 },
                pinnedItems: { nodes: [] },
            },
        });

        const profile = await fetchProfile("ghostuser");

        expect(profile.name).toBeNull();
        expect(profile.bio).toBeNull();
        expect(profile.pinnedRepos).toHaveLength(0);
    });

    it("maps a repo with no README to null", async () => {
        mockClient.mockResolvedValueOnce({
            user: {
                name: "Test User",
                bio: null,
                location: null,
                company: null,
                websiteUrl: null,
                avatarUrl: "https://avatars.githubusercontent.com/u/1",
                followers: { totalCount: 0 },
                following: { totalCount: 0 },
                pinnedItems: {
                    nodes: [
                        {
                            name: "no-readme-repo",
                            description: null,
                            url: "https://github.com/testuser/no-readme-repo",
                            primaryLanguage: null,
                            object: null,
                        },
                    ],
                },
            },
        });

        const profile = await fetchProfile("testuser");

        expect(profile.pinnedRepos[0]?.readme).toBeNull();
        expect(profile.pinnedRepos[0]?.primaryLanguage).toBeNull();
    });

    it("throws when user is not found", async () => {
        mockClient.mockResolvedValueOnce({ user: null });

        await expect(fetchProfile("nonexistentuser")).rejects.toThrow(
            'GitHub user "nonexistentuser" not found'
        );
    });

    it("throws a descriptive error on GraphQL API failure", async () => {
        mockClient.mockRejectedValueOnce(
            new GraphqlResponseError(
                { method: "POST", url: "https://api.github.com/graphql" },
                {},
                {
                    data: null,
                    errors: [{ message: "rate limit exceeded" }] as any,
                }
            )
        );

        await expect(fetchProfile("testuser")).rejects.toThrow(
            'GitHub API error for user "testuser"'
        );
    });
});

// ---------------------------------------------------------------------------
// fetchRepo
// ---------------------------------------------------------------------------

describe("fetchRepo", () => {
    it("returns a mapped GithubRepo when the repository exists", async () => {
        mockClient.mockResolvedValueOnce({
            repository: {
                name: "awesome-project",
                description: "A test repository",
                url: "https://github.com/testuser/awesome-project",
                primaryLanguage: { name: "TypeScript" },
                object: { text: "# Awesome Project" },
            },
        });

        const repo = await fetchRepo("testuser", "awesome-project");

        expect(repo.name).toBe("awesome-project");
        expect(repo.primaryLanguage).toBe("TypeScript");
        expect(repo.readme).toBe("# Awesome Project");
    });

    it("throws when repository is not found or is private", async () => {
        mockClient.mockResolvedValueOnce({ repository: null });

        await expect(fetchRepo("testuser", "private-repo")).rejects.toThrow(
            '"testuser/private-repo" not found or is private'
        );
    });

    it("throws a descriptive error on GraphQL API failure", async () => {
        mockClient.mockRejectedValueOnce(
            new GraphqlResponseError(
                { method: "POST", url: "https://api.github.com/graphql" },
                {},
                {
                    data: null,
                    errors: [{ message: "something went wrong" }] as any,
                }
            )
        );

        await expect(fetchRepo("testuser", "awesome-project")).rejects.toThrow(
            'GitHub API error for repo "testuser/awesome-project"'
        );
    });
});

// ---------------------------------------------------------------------------
// fetchRepoBySlug
// ---------------------------------------------------------------------------

describe("fetchRepoBySlug", () => {
    it("correctly parses a valid owner/repo slug", async () => {
        mockClient.mockResolvedValueOnce({
            repository: {
                name: "next.js",
                description: "The React Framework",
                url: "https://github.com/vercel/next.js",
                primaryLanguage: { name: "TypeScript" },
                object: null,
            },
        });

        const repo = await fetchRepoBySlug("vercel/next.js");

        expect(repo.name).toBe("next.js");
    });

    it("throws on an invalid slug format", async () => {
        await expect(fetchRepoBySlug("invalid-slug")).rejects.toThrow(
            'Invalid repository slug "invalid-slug". Expected format: "owner/repo"'
        );
    });

    it("throws on an empty slug", async () => {
        await expect(fetchRepoBySlug("")).rejects.toThrow(
            "Invalid repository slug"
        );
    });

    it("throws on a slug with too many segments", async () => {
        await expect(fetchRepoBySlug("owner/repo/extra")).rejects.toThrow(
            "Invalid repository slug"
        );
    });
});
