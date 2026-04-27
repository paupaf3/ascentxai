import { describe, it, expect } from "vitest";
import { buildPrompt } from "../../../src/modules/analyzer/prompt-builder";
import { fullCandidateFixture } from "../candidate/fixtures/profile.fixture";
import { profileFixture } from "../github/fixtures/profile.fixture";
import { repoNoReadmeFixture } from "../github/fixtures/repo.fixture";
import { fullLinkedInFixture } from "../linkedin/fixtures/profile.fixture";
import type { GithubProfile } from "../../../src/types/github/github";

const GOAL = "Staff Engineer at a B2B SaaS company";

describe("buildPrompt", () => {
    it("contains all three required output section headings", () => {
        const prompt = buildPrompt(fullCandidateFixture, profileFixture, GOAL);
        expect(prompt).toContain("## Current Standing");
        expect(prompt).toContain("## Technical Blind Spots");
        expect(prompt).toContain("## The Level-Up Roadmap");
    });

    it("embeds the career goal verbatim", () => {
        const prompt = buildPrompt(fullCandidateFixture, profileFixture, GOAL);
        expect(prompt).toContain(GOAL);
    });

    it("includes candidate top skills and experience", () => {
        const prompt = buildPrompt(fullCandidateFixture, profileFixture, GOAL);
        expect(prompt).toContain("TypeScript");
        expect(prompt).toContain("10 years");
        expect(prompt).toContain("Staff Software Engineer");
    });

    it("includes GitHub username and pinned repo", () => {
        const prompt = buildPrompt(fullCandidateFixture, profileFixture, GOAL);
        expect(prompt).toContain("testuser");
        expect(prompt).toContain("awesome-project");
    });

    it("includes repo primary language", () => {
        const prompt = buildPrompt(fullCandidateFixture, profileFixture, GOAL);
        expect(prompt).toContain("[TypeScript]");
    });

    it("truncates README excerpts to 600 characters", () => {
        const longReadme = "A".repeat(1000);
        const portfolio: GithubProfile = {
            ...profileFixture,
            pinnedRepos: [
                { ...profileFixture.pinnedRepos[0], readme: longReadme },
            ],
        };
        const prompt = buildPrompt(fullCandidateFixture, portfolio, GOAL);
        expect(prompt).toContain("…");
        expect(prompt).not.toContain("A".repeat(700));
    });

    it("handles repos with no README or description gracefully", () => {
        const portfolio: GithubProfile = {
            ...profileFixture,
            pinnedRepos: [repoNoReadmeFixture],
        };
        const prompt = buildPrompt(fullCandidateFixture, portfolio, GOAL);
        expect(prompt).toContain("No description");
        expect(prompt).not.toContain("README:");
    });

    it("handles a profile with no pinned repos", () => {
        const portfolio: GithubProfile = { ...profileFixture, pinnedRepos: [] };
        const prompt = buildPrompt(fullCandidateFixture, portfolio, GOAL);
        expect(prompt).toContain("No pinned repositories.");
    });

    it("handles nullable candidate fields without crashing", () => {
        const sparseProfile = {
            ...fullCandidateFixture,
            headline: null,
            summary: null,
            totalYearsOfExperience: null,
            mostRecentJobTitle: null,
            topSkills: [],
            roles: [],
            education: [],
        };
        expect(() =>
            buildPrompt(sparseProfile, profileFixture, GOAL)
        ).not.toThrow();
    });

    describe("without LinkedIn", () => {
        it("does not include a LINKEDIN PROFILE section", () => {
            const prompt = buildPrompt(
                fullCandidateFixture,
                profileFixture,
                GOAL
            );
            expect(prompt).not.toContain("LINKEDIN PROFILE");
        });

        it("lists three data sources", () => {
            const prompt = buildPrompt(
                fullCandidateFixture,
                profileFixture,
                GOAL
            );
            expect(prompt).toContain("3. Their stated career goal");
            expect(prompt).not.toContain("4. Their stated career goal");
        });
    });

    describe("with LinkedIn", () => {
        it("includes a LINKEDIN PROFILE section", () => {
            const prompt = buildPrompt(
                fullCandidateFixture,
                profileFixture,
                GOAL,
                fullLinkedInFixture
            );
            expect(prompt).toContain("=== LINKEDIN PROFILE ===");
        });

        it("includes endorsed skills with counts", () => {
            const prompt = buildPrompt(
                fullCandidateFixture,
                profileFixture,
                GOAL,
                fullLinkedInFixture
            );
            expect(prompt).toContain("TypeScript");
            expect(prompt).toContain("42 endorsements");
        });

        it("includes recommendations", () => {
            const prompt = buildPrompt(
                fullCandidateFixture,
                profileFixture,
                GOAL,
                fullLinkedInFixture
            );
            expect(prompt).toContain("Charles Babbage");
            expect(prompt).toContain("Ada is an exceptional engineer");
        });

        it("includes courses", () => {
            const prompt = buildPrompt(
                fullCandidateFixture,
                profileFixture,
                GOAL,
                fullLinkedInFixture
            );
            expect(prompt).toContain("Distributed Systems");
        });

        it("lists four data sources", () => {
            const prompt = buildPrompt(
                fullCandidateFixture,
                profileFixture,
                GOAL,
                fullLinkedInFixture
            );
            expect(prompt).toContain("4. Their stated career goal");
        });

        it("includes LinkedIn endorsement cross-check instructions", () => {
            const prompt = buildPrompt(
                fullCandidateFixture,
                profileFixture,
                GOAL,
                fullLinkedInFixture
            );
            expect(prompt).toContain("endorsement counts");
        });

        it("handles a LinkedIn profile with no endorsements or recommendations", () => {
            const sparseLinkedIn = {
                ...fullLinkedInFixture,
                endorsedSkills: [],
                recommendations: [],
                courses: [],
                volunteerExperience: [],
            };
            expect(() =>
                buildPrompt(
                    fullCandidateFixture,
                    profileFixture,
                    GOAL,
                    sparseLinkedIn
                )
            ).not.toThrow();
        });
    });
});
