import { describe, it, expect } from "vitest";
import { computeMatch } from "../../../src/modules/job/matcher";
import { fullCandidateFixture } from "../candidate/fixtures/profile.fixture";
import { profileFixture } from "../github/fixtures/profile.fixture";
import { repoFixture } from "../github/fixtures/repo.fixture";
import type {
    JobDescription,
    MatchResult,
} from "../../../src/types/job/job-description";
import type { GithubProfile } from "../../../src/types/github/github";

const fullJobDescription: JobDescription = {
    title: "Senior Software Engineer",
    company: "TechCorp",
    seniorityLevel: "senior",
    minYearsExperience: 5,
    requiredSkills: ["TypeScript", "PostgreSQL", "AWS", "Kubernetes"],
    preferredSkills: ["Python", "Docker", "GraphQL"],
    responsibilities: [
        "Design and build distributed systems",
        "Mentor junior engineers",
    ],
    domain: "developer-tooling",
};

const fullMatchKeys: (keyof MatchResult)[] = [
    "overallScore",
    "requiredSkillsScore",
    "preferredSkillsScore",
    "experienceScore",
    "averageTechDepthScore",
    "matchedRequired",
    "missingRequired",
    "matchedPreferred",
];

describe("computeMatch", () => {
    it("returns all required match fields", () => {
        const result = computeMatch(
            fullCandidateFixture,
            profileFixture,
            fullJobDescription
        );
        for (const key of fullMatchKeys) {
            expect(result).toHaveProperty(key);
        }
    });

    it("scores a full match at 100 when candidate meets every requirement", () => {
        const candidate = {
            ...fullCandidateFixture,
            skills: {
                ...fullCandidateFixture.skills,
                languages: [
                    ...fullCandidateFixture.skills.languages,
                    "TypeScript",
                ],
                cloudAndInfra: [
                    ...fullCandidateFixture.skills.cloudAndInfra,
                    "AWS",
                ],
                tools: [
                    ...fullCandidateFixture.skills.tools,
                    "Kubernetes",
                ],
            },
            topSkills: ["TypeScript", "PostgreSQL", "AWS", "Kubernetes", "Go"],
            totalYearsOfExperience: 6,
        };
        const job: JobDescription = {
            ...fullJobDescription,
            requiredSkills: ["TypeScript"],
            preferredSkills: [],
            minYearsExperience: 5,
        };
        const portfolio: GithubProfile = {
            ...profileFixture,
            pinnedRepos: [
                { ...repoFixture, name: "proj-a", primaryLanguage: "TypeScript" },
                { ...repoFixture, name: "proj-b", primaryLanguage: "TypeScript" },
            ],
        };

        const result = computeMatch(candidate, portfolio, job);

        expect(result.requiredSkillsScore).toBe(100);
        expect(result.experienceScore).toBe(100);
        expect(result.matchedRequired).toHaveLength(1);
        expect(result.missingRequired).toHaveLength(0);
        expect(result.overallScore).toBe(100);
    });

    it("scores a partial match proportionally", () => {
        const candidate = {
            ...fullCandidateFixture,
            skills: {
                ...fullCandidateFixture.skills,
                languages: ["Python"],
                cloudAndInfra: [],
                tools: [],
            },
            topSkills: ["Python"],
            totalYearsOfExperience: 2,
        };
        const job: JobDescription = {
            ...fullJobDescription,
            requiredSkills: ["TypeScript", "AWS", "Kubernetes"],
            preferredSkills: [],
            minYearsExperience: 5,
        };
        const portfolio: GithubProfile = {
            ...profileFixture,
            pinnedRepos: [],
        };

        const result = computeMatch(candidate, portfolio, job);

        expect(result.requiredSkillsScore).toBe(0);
        expect(result.experienceScore).toBe(40);
        expect(result.matchedRequired).toHaveLength(0);
        expect(result.missingRequired).toHaveLength(3);
        expect(result.missingRequired).toContain("TypeScript");
        expect(result.missingRequired).toContain("AWS");
        expect(result.missingRequired).toContain("Kubernetes");
    });

    it("returns 0 overall when nothing matches", () => {
        const candidate = {
            ...fullCandidateFixture,
            skills: {
                languages: ["Ruby"],
                frameworks: [],
                databases: [],
                cloudAndInfra: [],
                tools: [],
                other: [],
            },
            topSkills: [],
            totalYearsOfExperience: 0,
            roles: [],
        };
        const job: JobDescription = {
            ...fullJobDescription,
            requiredSkills: ["Go", "Rust", "C++"],
            preferredSkills: ["Zig"],
            minYearsExperience: 10,
        };

        const result = computeMatch(
            candidate,
            { ...profileFixture, pinnedRepos: [] },
            job
        );

        expect(result.requiredSkillsScore).toBe(0);
        expect(result.preferredSkillsScore).toBe(0);
        expect(result.experienceScore).toBe(0);
        expect(result.matchedRequired).toHaveLength(0);
        expect(result.missingRequired).toHaveLength(3);
        expect(result.matchedPreferred).toHaveLength(0);
    });

    it("handles empty required and preferred skills gracefully", () => {
        const job: JobDescription = {
            ...fullJobDescription,
            requiredSkills: [],
            preferredSkills: [],
        };

        const result = computeMatch(fullCandidateFixture, profileFixture, job);

        expect(result.requiredSkillsScore).toBe(100);
        expect(result.preferredSkillsScore).toBe(100);
        expect(result.matchedRequired).toHaveLength(0);
        expect(result.missingRequired).toHaveLength(0);
    });

    it("handles zero minYearsExperience gracefully", () => {
        const job: JobDescription = {
            ...fullJobDescription,
            minYearsExperience: 0,
        };

        const result = computeMatch(fullCandidateFixture, profileFixture, job);

        expect(result.experienceScore).toBe(100);
    });

    it("caps experience score at 100%", () => {
        const candidate = {
            ...fullCandidateFixture,
            totalYearsOfExperience: 20,
        };
        const job: JobDescription = {
            ...fullJobDescription,
            minYearsExperience: 5,
        };

        const result = computeMatch(candidate, profileFixture, job);

        expect(result.experienceScore).toBe(100);
    });

    it("uses years from candidate when they are null", () => {
        const candidate = {
            ...fullCandidateFixture,
            totalYearsOfExperience: null,
        };
        const job: JobDescription = {
            ...fullJobDescription,
            minYearsExperience: 3,
        };

        const result = computeMatch(candidate, profileFixture, job);

        expect(result.experienceScore).toBe(0);
    });

    it("returns 0 average tech depth when no required skills match", () => {
        const candidate = {
            ...fullCandidateFixture,
            skills: {
                languages: ["Ruby"],
                frameworks: [],
                databases: [],
                cloudAndInfra: [],
                tools: [],
                other: [],
            },
            topSkills: [],
        };
        const job: JobDescription = {
            ...fullJobDescription,
            requiredSkills: ["Zig"],
            preferredSkills: [],
        };

        const result = computeMatch(
            candidate,
            { ...profileFixture, pinnedRepos: [] },
            job
        );

        expect(result.averageTechDepthScore).toBe(0);
    });

    it("normalizes skill names (case and special characters)", () => {
        const candidate = {
            ...fullCandidateFixture,
            skills: {
                ...fullCandidateFixture.skills,
                languages: ["TypeScript", "python"],
                cloudAndInfra: ["AWS", "aws"],
                tools: ["Kubernetes"],
            },
            topSkills: ["typescript", "PostgreSQL", "node.js", "aws"],
        };
        const job: JobDescription = {
            ...fullJobDescription,
            requiredSkills: ["TypeScript", "Node.js"],
            preferredSkills: ["Python"],
        };

        const result = computeMatch(candidate, profileFixture, job);

        expect(result.matchedRequired).toHaveLength(2);
        expect(result.missingRequired).toHaveLength(0);
        expect(result.matchedPreferred).toContain("Python");
    });

    it("computes preferred skills independently", () => {
        const candidate = {
            ...fullCandidateFixture,
            skills: {
                languages: ["GraphQL"],
                frameworks: [],
                databases: [],
                cloudAndInfra: [],
                tools: [],
                other: [],
            },
            topSkills: [],
        };
        const job: JobDescription = {
            ...fullJobDescription,
            requiredSkills: ["Zig"],
            preferredSkills: ["GraphQL"],
        };

        const result = computeMatch(
            candidate,
            { ...profileFixture, pinnedRepos: [] },
            job
        );

        expect(result.requiredSkillsScore).toBe(0);
        expect(result.preferredSkillsScore).toBe(100);
        expect(result.matchedPreferred).toHaveLength(1);
        expect(result.matchedPreferred[0]).toBe("GraphQL");
    });

    it("returns correct weighted overall score", () => {
        const result = computeMatch(
            fullCandidateFixture,
            profileFixture,
            fullJobDescription
        );

        const expectedOverall =
            result.requiredSkillsScore * 0.45 +
            result.experienceScore * 0.25 +
            result.averageTechDepthScore * 0.2 +
            result.preferredSkillsScore * 0.1;

        expect(result.overallScore).toBe(Math.round(expectedOverall));
    });
});

describe("computeMatch — tech depth scoring", () => {
    it("assigns depth 0 when skill is not in resume and not in repos", () => {
        const candidate = {
            ...fullCandidateFixture,
            skills: {
                languages: [],
                frameworks: [],
                databases: [],
                cloudAndInfra: [],
                tools: [],
                other: [],
            },
            topSkills: [],
        };
        const job: JobDescription = {
            ...fullJobDescription,
            requiredSkills: ["Rust"],
        };

        const result = computeMatch(
            candidate,
            { ...profileFixture, pinnedRepos: [] },
            job
        );

        expect(result.missingRequired).toContain("Rust");
        expect(result.matchedRequired.find((m) => m.skill === "Rust")).toBeUndefined();
    });

    it("assigns depth 1 when skill is in resume but not in repos", () => {
        const candidate = {
            ...fullCandidateFixture,
            skills: {
                ...fullCandidateFixture.skills,
                languages: ["Rust"],
            },
            topSkills: ["Rust"],
        };
        const job: JobDescription = {
            ...fullJobDescription,
            requiredSkills: ["Rust"],
        };

        const result = computeMatch(
            candidate,
            { ...profileFixture, pinnedRepos: [] },
            job
        );

        const match = result.matchedRequired.find((m) => m.skill === "Rust");
        expect(match?.depth).toBe(1);
    });

    it("assigns depth 2 when skill is in resume and matches one repo", () => {
        const candidate = {
            ...fullCandidateFixture,
            skills: {
                ...fullCandidateFixture.skills,
                languages: ["Rust"],
            },
            topSkills: ["Rust"],
        };
        const portfolio: GithubProfile = {
            ...profileFixture,
            pinnedRepos: [{ ...repoFixture, primaryLanguage: "Rust" }],
        };
        const job: JobDescription = {
            ...fullJobDescription,
            requiredSkills: ["Rust"],
        };

        const result = computeMatch(candidate, portfolio, job);

        const match = result.matchedRequired.find((m) => m.skill === "Rust");
        expect(match?.depth).toBe(2);
    });

    it("assigns depth 3 when skill is in resume and matches two repos", () => {
        const candidate = {
            ...fullCandidateFixture,
            skills: {
                ...fullCandidateFixture.skills,
                languages: ["Rust"],
            },
            topSkills: ["Rust"],
        };
        const portfolio: GithubProfile = {
            ...profileFixture,
            pinnedRepos: [
                { ...repoFixture, name: "project-a", primaryLanguage: "Rust" },
                { ...repoFixture, name: "project-b", primaryLanguage: "Rust" },
            ],
        };
        const job: JobDescription = {
            ...fullJobDescription,
            requiredSkills: ["Rust"],
        };

        const result = computeMatch(candidate, portfolio, job);

        const match = result.matchedRequired.find((m) => m.skill === "Rust");
        expect(match?.depth).toBe(3);
    });

    it("matches repo by description when primaryLanguage differs", () => {
        const candidate = {
            ...fullCandidateFixture,
            skills: {
                ...fullCandidateFixture.skills,
                languages: ["Rust"],
            },
            topSkills: ["Rust"],
        };
        const portfolio: GithubProfile = {
            ...profileFixture,
            pinnedRepos: [
                {
                    ...repoFixture,
                    name: "my-project",
                    primaryLanguage: "Python",
                    description: "A Rust-powered CLI tool",
                },
            ],
        };
        const job: JobDescription = {
            ...fullJobDescription,
            requiredSkills: ["Rust"],
        };

        const result = computeMatch(candidate, portfolio, job);

        const match = result.matchedRequired.find((m) => m.skill === "Rust");
        expect(match?.depth).toBe(2);
    });

    it("matches repo by name when primaryLanguage and description differ", () => {
        const candidate = {
            ...fullCandidateFixture,
            skills: {
                ...fullCandidateFixture.skills,
                languages: ["Rust"],
            },
            topSkills: ["Rust"],
        };
        const portfolio: GithubProfile = {
            ...profileFixture,
            pinnedRepos: [
                {
                    ...repoFixture,
                    name: "rust-cli-tool",
                    primaryLanguage: "Python",
                    description: "Some tool",
                },
            ],
        };
        const job: JobDescription = {
            ...fullJobDescription,
            requiredSkills: ["Rust"],
        };

        const result = computeMatch(candidate, portfolio, job);

        const match = result.matchedRequired.find((m) => m.skill === "Rust");
        expect(match?.depth).toBe(2);
    });

    it("computes average tech depth from all matched skills", () => {
        const candidate = {
            ...fullCandidateFixture,
            skills: {
                ...fullCandidateFixture.skills,
                languages: ["TypeScript", "Python"],
                cloudAndInfra: ["AWS"],
                tools: ["Kubernetes", "Docker"],
            },
            topSkills: ["TypeScript", "Python", "AWS", "Kubernetes", "Docker"],
        };
        const portfolio: GithubProfile = {
            ...profileFixture,
            pinnedRepos: [
                { ...repoFixture, primaryLanguage: "TypeScript" },
                { ...repoFixture, name: "py-tool", primaryLanguage: "Python" },
            ],
        };
        const job: JobDescription = {
            ...fullJobDescription,
            requiredSkills: ["TypeScript", "Python", "AWS", "Kubernetes"],
            minYearsExperience: 1,
        };

        const result = computeMatch(candidate, portfolio, job);

        const tsDepth =
            result.matchedRequired.find(
                (m) => m.skill === "TypeScript"
            )?.depth ?? 0;
        const pyDepth =
            result.matchedRequired.find((m) => m.skill === "Python")?.depth ?? 0;
        const awsDepth =
            result.matchedRequired.find((m) => m.skill === "AWS")?.depth ?? 0;
        const k8sDepth =
            result.matchedRequired.find((m) => m.skill === "Kubernetes")?.depth ?? 0;

        const depths = [tsDepth, pyDepth, awsDepth, k8sDepth];
        const expectedAvg =
            depths.reduce((a, b) => a + b, 0) / depths.length / 3;
        const expectedAvgRounded = Math.round(expectedAvg * 100);

        expect(result.averageTechDepthScore).toBe(expectedAvgRounded);
    });
});
