import { describe, it, expect } from "vitest";
import { buildPrompt } from "../../../src/modules/analyzer/prompt-builder";
import { fullCandidateFixture } from "../candidate/fixtures/profile.fixture";
import { profileFixture } from "../github/fixtures/profile.fixture";
import { fullLinkedInFixture } from "../linkedin/fixtures/profile.fixture";
import type { GithubProfile } from "../../../src/types/github/github";
import type { AnalysisTarget } from "../../../src/types/analysis-target";
import type {
    JobDescription,
    MatchResult,
} from "../../../src/types/job/job-description";

const jobDescription: JobDescription = {
    title: "Senior Software Engineer",
    company: "TechCorp",
    seniorityLevel: "senior",
    minYearsExperience: 5,
    requiredSkills: ["TypeScript", "AWS", "Kubernetes", "PostgreSQL"],
    preferredSkills: ["Python", "GraphQL"],
    responsibilities: [
        "Design and build distributed systems",
        "Mentor junior engineers",
    ],
    domain: "developer-tooling",
};

const matchResult: MatchResult = {
    overallScore: 72,
    requiredSkillsScore: 75,
    preferredSkillsScore: 50,
    experienceScore: 100,
    averageTechDepthScore: 67,
    matchedRequired: [
        { skill: "TypeScript", depth: 3 },
        { skill: "PostgreSQL", depth: 2 },
        { skill: "AWS", depth: 1 },
    ],
    missingRequired: ["Kubernetes"],
    matchedPreferred: ["Python"],
};

const TARGET: AnalysisTarget = {
    mode: "job",
    jobInput: "https://example.com/jobs/senior-engineer",
};

describe("buildPrompt — job mode", () => {
    it("contains all five required output section headings", () => {
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            null,
            jobDescription,
            matchResult
        );
        expect(prompt).toContain("## Match Summary");
        expect(prompt).toContain("## Current Standing");
        expect(prompt).toContain("## Technical Blind Spots");
        expect(prompt).toContain("## Quick Wins");
        expect(prompt).toContain("## The Level-Up Roadmap");
    });

    it("includes a JOB DESCRIPTION section with job title and company", () => {
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            null,
            jobDescription,
            matchResult
        );
        expect(prompt).toContain("=== JOB DESCRIPTION ===");
        expect(prompt).toContain("Senior Software Engineer @ TechCorp");
    });

    it("includes a MATCH SCORECARD section with overall score", () => {
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            null,
            jobDescription,
            matchResult
        );
        expect(prompt).toContain("=== MATCH SCORECARD ===");
        expect(prompt).toContain("Overall match:");
        expect(prompt).toContain("72%");
    });

    it("includes the job's required and preferred skills", () => {
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            null,
            jobDescription,
            matchResult
        );
        expect(prompt).toContain("TypeScript");
        expect(prompt).toContain("AWS");
        expect(prompt).toContain("Kubernetes");
        expect(prompt).toContain("Python");
        expect(prompt).toContain("GraphQL");
    });

    it("includes the match score for each sub-component", () => {
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            null,
            jobDescription,
            matchResult
        );
        expect(prompt).toContain("Required skills:");
        expect(prompt).toContain("75%");
        expect(prompt).toContain("Experience:");
        expect(prompt).toContain("100%");
        expect(prompt).toContain("Tech depth:");
        expect(prompt).toContain("67%");
    });

    it("lists matched required skills with depth", () => {
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            null,
            jobDescription,
            matchResult
        );
        expect(prompt).toContain("TypeScript");
        expect(prompt).toContain("PostgreSQL");
        expect(prompt).toContain("AWS");
    });

    it("lists missing required skills", () => {
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            null,
            jobDescription,
            matchResult
        );
        expect(prompt).toContain("Missing required:");
        expect(prompt).toContain("Kubernetes");
    });

    it("lists strongest matches (depth >= 2)", () => {
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            null,
            jobDescription,
            matchResult
        );
        const strongestLine = prompt
            .split("\n")
            .find((l) => l.startsWith("Strongest matches:"));
        expect(strongestLine).toContain("TypeScript");
        expect(strongestLine).toContain("PostgreSQL");
        expect(strongestLine).not.toContain("AWS");
    });

    it("includes the job seniority level and experience requirement", () => {
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            null,
            jobDescription,
            matchResult
        );
        expect(prompt).toContain("Seniority: senior");
        expect(prompt).toContain("Experience required: 5+ years");
    });

    it("includes the job domain", () => {
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            null,
            jobDescription,
            matchResult
        );
        expect(prompt).toContain("Domain: developer-tooling");
    });

    it("lists three data sources when LinkedIn is absent", () => {
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            null,
            jobDescription,
            matchResult
        );
        expect(prompt).toContain("3. A target job description");
        expect(prompt).not.toContain("4.");
    });

    it("lists four data sources when LinkedIn is present", () => {
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            fullLinkedInFixture,
            jobDescription,
            matchResult
        );
        expect(prompt).toContain("4. A target job description");
    });

    it("includes LinkedIn profile data when provided", () => {
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            fullLinkedInFixture,
            jobDescription,
            matchResult
        );
        expect(prompt).toContain("=== LINKEDIN PROFILE ===");
        expect(prompt).toContain("42 endorsements");
    });

    it("does not include a LINKEDIN PROFILE section when not provided", () => {
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            null,
            jobDescription,
            matchResult
        );
        expect(prompt).not.toContain("LINKEDIN PROFILE");
    });

    it("includes the scorecard match count for required skills", () => {
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            null,
            jobDescription,
            matchResult
        );
        expect(prompt).toContain("3/4 matched");
    });

    it("includes the preferred skills section when preferred skills exist", () => {
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            null,
            jobDescription,
            matchResult
        );
        expect(prompt).toContain("Preferred skills:");
        expect(prompt).toContain("50%");
    });

    it("omits preferred skills line in scorecard when job has no preferred skills", () => {
        const noPreferredJob = { ...jobDescription, preferredSkills: [] };
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            null,
            noPreferredJob,
            { ...matchResult, matchedPreferred: [] }
        );
        const scorecardLines = prompt
            .split("\n")
            .filter((l) => l.includes("Preferred skills:"));
        expect(scorecardLines).toHaveLength(0);
    });

    it("renders the match scorecard with progress bar characters", () => {
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            null,
            jobDescription,
            matchResult
        );
        expect(prompt).toContain("█");
        expect(prompt).toContain("░");
    });

    it("renders the progress bar proportionally for a 100% score", () => {
        const fullMatch: MatchResult = {
            overallScore: 100,
            requiredSkillsScore: 100,
            preferredSkillsScore: 100,
            experienceScore: 100,
            averageTechDepthScore: 100,
            matchedRequired: [{ skill: "TypeScript", depth: 3 }],
            missingRequired: [],
            matchedPreferred: [],
        };
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            null,
            jobDescription,
            fullMatch
        );
        expect(prompt).toContain("████████");
    });

    it("renders the progress bar proportionally for a 0% score", () => {
        const noMatch: MatchResult = {
            overallScore: 0,
            requiredSkillsScore: 0,
            preferredSkillsScore: 0,
            experienceScore: 0,
            averageTechDepthScore: 0,
            matchedRequired: [],
            missingRequired: ["TypeScript", "AWS", "Kubernetes", "PostgreSQL"],
            matchedPreferred: [],
        };
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            null,
            jobDescription,
            noMatch
        );
        expect(prompt).toContain("░░░░░░░░░░ 0%");
    });

    it("includes LinkedIn endorsement cross-check instructions when LinkedIn is present", () => {
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            fullLinkedInFixture,
            jobDescription,
            matchResult
        );
        expect(prompt).toContain("endorsement counts");
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
            buildPrompt(
                sparseProfile,
                profileFixture,
                TARGET,
                null,
                jobDescription,
                matchResult
            )
        ).not.toThrow();
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
                TARGET,
                sparseLinkedIn,
                jobDescription,
                matchResult
            )
        ).not.toThrow();
    });

    it("includes the scorecard tech depth section", () => {
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            null,
            jobDescription,
            matchResult
        );
        expect(prompt).toContain("Tech depth:");
    });

    it("includes the match scorecard instruction to treat scores as ground truth", () => {
        const prompt = buildPrompt(
            fullCandidateFixture,
            profileFixture,
            TARGET,
            null,
            jobDescription,
            matchResult
        );
        expect(prompt).toContain("match scorecard has been computed");
        expect(prompt).toContain("ground truth");
    });
});
