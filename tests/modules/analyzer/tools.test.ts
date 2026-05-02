import { describe, it, expect, vi, beforeEach } from "vitest";
import { repoFixture } from "../github/fixtures/repo.fixture";

vi.mock("../../../src/modules/github/github-client", () => ({
    fetchRepoBySlug: vi.fn(),
    fetchTopRepositories: vi.fn(),
}));

import {
    fetchRepoBySlug,
    fetchTopRepositories,
} from "../../../src/modules/github/github-client";
import {
    fetchGithubRepoTool,
    fetchTopGithubReposTool,
} from "../../../src/modules/analyzer/tools";

const mockedFetchRepoBySlug = fetchRepoBySlug as ReturnType<typeof vi.fn>;
const mockedFetchTopRepositories = fetchTopRepositories as ReturnType<
    typeof vi.fn
>;

// Minimal RuntimeContext stub required by Mastra's ToolExecutionContext
const runtimeContext = {} as any;

beforeEach(() => {
    vi.clearAllMocks();
});

describe("fetchGithubRepoTool", () => {
    it("delegates to fetchRepoBySlug with the provided slug", async () => {
        mockedFetchRepoBySlug.mockResolvedValueOnce(repoFixture);

        const result = await fetchGithubRepoTool.execute!({
            context: { slug: "testuser/awesome-project" },
            runtimeContext,
        });

        expect(mockedFetchRepoBySlug).toHaveBeenCalledWith(
            "testuser/awesome-project"
        );
        expect(result).toEqual(repoFixture);
    });

    it("propagates errors from fetchRepoBySlug", async () => {
        mockedFetchRepoBySlug.mockRejectedValueOnce(
            new Error('"testuser/private-repo" not found or is private')
        );

        await expect(
            fetchGithubRepoTool.execute!({
                context: { slug: "testuser/private-repo" },
                runtimeContext,
            })
        ).rejects.toThrow("not found or is private");
    });
});

describe("fetchTopGithubReposTool", () => {
    it("delegates to fetchTopRepositories with username and default limit", async () => {
        mockedFetchTopRepositories.mockResolvedValueOnce([repoFixture]);

        const result = await fetchTopGithubReposTool.execute!({
            context: { username: "testuser" },
            runtimeContext,
        });

        expect(mockedFetchTopRepositories).toHaveBeenCalledWith("testuser", 10);
        expect(result).toEqual([repoFixture]);
    });

    it("forwards an explicit limit to fetchTopRepositories", async () => {
        mockedFetchTopRepositories.mockResolvedValueOnce([repoFixture]);

        await fetchTopGithubReposTool.execute!({
            context: { username: "testuser", limit: 5 },
            runtimeContext,
        });

        expect(mockedFetchTopRepositories).toHaveBeenCalledWith("testuser", 5);
    });

    it("returns an empty array when the user has no public repos", async () => {
        mockedFetchTopRepositories.mockResolvedValueOnce([]);

        const result = await fetchTopGithubReposTool.execute!({
            context: { username: "testuser" },
            runtimeContext,
        });

        expect(result).toEqual([]);
    });

    it("propagates errors from fetchTopRepositories", async () => {
        mockedFetchTopRepositories.mockRejectedValueOnce(
            new Error('GitHub user "ghost" not found')
        );

        await expect(
            fetchTopGithubReposTool.execute!({
                context: { username: "ghost" },
                runtimeContext,
            })
        ).rejects.toThrow('GitHub user "ghost" not found');
    });
});
