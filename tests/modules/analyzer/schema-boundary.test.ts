import { describe, it, expect } from "vitest";
import { candidateProfileSchema } from "../../../src/types/candidate/profile";
import { linkedinProfileSchema } from "../../../src/types/linkedin/linkedin-profile";
import { jobDescriptionSchema } from "../../../src/types/job/job-description";
import { githubProfileSchema } from "../../../src/types/github/github";

const baseCandidate = {
    fullName: "Test User",
    email: "test@example.com",
    phone: null,
    location: "Somewhere",
    headline: "Engineer",
    summary: null,
    links: { github: null, linkedin: null, website: null },
    totalYearsOfExperience: 5,
    mostRecentJobTitle: "Engineer",
    roles: [],
    skills: {
        languages: [],
        frameworks: [],
        databases: [],
        cloudAndInfra: [],
        tools: [],
        other: [],
    },
    topSkills: [],
    education: [],
    certifications: [],
    spokenLanguages: [],
};

const baseJob = {
    title: "Engineer",
    company: null,
    seniorityLevel: null,
    minYearsExperience: null,
    requiredSkills: [],
    preferredSkills: [],
    responsibilities: [],
    domain: null,
};

const baseGitHub = {
    username: "testuser",
    name: null,
    bio: null,
    location: null,
    company: null,
    websiteUrl: null,
    avatarUrl: "https://avatars.githubusercontent.com/u/1",
    followers: 0,
    following: 0,
    pinnedRepos: [],
};

describe("candidateProfileSchema — boundary values", () => {
    it("accepts empty strings for nullable string fields", () => {
        const result = candidateProfileSchema.safeParse({
            ...baseCandidate,
            fullName: "",
            email: "",
            phone: "",
            location: "",
        });
        expect(result.success).toBe(true);
    });

    it("accepts very long strings", () => {
        const longStr = "A".repeat(10000);
        const result = candidateProfileSchema.safeParse({
            ...baseCandidate,
            fullName: longStr,
            summary: longStr,
        });
        expect(result.success).toBe(true);
    });

    it("accepts unicode and emoji in string fields", () => {
        const result = candidateProfileSchema.safeParse({
            ...baseCandidate,
            fullName: "José García 💻",
            summary: "Engineer — líder técnico (espaÑol)",
        });
        expect(result.success).toBe(true);
    });

    it("accepts a large number of roles", () => {
        const manyRoles = Array.from({ length: 50 }, (_, i) => ({
            title: `Role ${i}`,
            company: "Company",
            location: "Remote",
            startDate: null,
            endDate: null,
            yearsInRole: null,
            summary: null,
            technologies: [],
        }));
        const result = candidateProfileSchema.safeParse({
            ...baseCandidate,
            roles: manyRoles,
        });
        expect(result.success).toBe(true);
    });

    it("accepts roles with null dates", () => {
        const result = candidateProfileSchema.safeParse({
            ...baseCandidate,
            roles: [
                {
                    title: "Engineer",
                    company: null,
                    location: null,
                    startDate: null,
                    endDate: null,
                    yearsInRole: null,
                    summary: null,
                    technologies: [],
                },
            ],
        });
        expect(result.success).toBe(true);
    });

    it("rejects an invalid date format on roles", () => {
        const result = candidateProfileSchema.safeParse({
            ...baseCandidate,
            roles: [
                {
                    title: "Engineer",
                    company: "Acme",
                    location: null,
                    startDate: "01-01-2020",
                    endDate: "invalid",
                    yearsInRole: null,
                    summary: null,
                    technologies: [],
                },
            ],
        });
        expect(result.success).toBe(false);
    });

    it("rejects topSkills exceeding max 5", () => {
        const result = candidateProfileSchema.safeParse({
            ...baseCandidate,
            topSkills: ["a", "b", "c", "d", "e", "f"],
        });
        expect(result.success).toBe(false);
    });

    it("accepts exactly 5 topSkills", () => {
        const result = candidateProfileSchema.safeParse({
            ...baseCandidate,
            topSkills: ["a", "b", "c", "d", "e"],
        });
        expect(result.success).toBe(true);
    });

    it("accepts fullName as null", () => {
        const result = candidateProfileSchema.safeParse({
            ...baseCandidate,
            fullName: null,
        });
        expect(result.success).toBe(true);
        expect(result.data?.fullName).toBeNull();
    });

    it("rejects missing skills object", () => {
        const result = candidateProfileSchema.safeParse({
            ...baseCandidate,
            skills: undefined,
        });
        expect(result.success).toBe(false);
    });

    it("rejects partial skills object (missing buckets)", () => {
        const result = candidateProfileSchema.safeParse({
            ...baseCandidate,
            skills: { languages: [] },
        });
        expect(result.success).toBe(false);
    });

    it("accepts negative totalYearsOfExperience", () => {
        const result = candidateProfileSchema.safeParse({
            ...baseCandidate,
            totalYearsOfExperience: -1,
        });
        expect(result.success).toBe(true);
    });

    it("accepts fractional totalYearsOfExperience", () => {
        const result = candidateProfileSchema.safeParse({
            ...baseCandidate,
            totalYearsOfExperience: 3.5,
        });
        expect(result.success).toBe(true);
    });

    it("accepts large totalYearsOfExperience", () => {
        const result = candidateProfileSchema.safeParse({
            ...baseCandidate,
            totalYearsOfExperience: 999,
        });
        expect(result.success).toBe(true);
    });
});

describe("linkedinProfileSchema — boundary values", () => {
    it("accepts empty endorsed skills", () => {
        const result = linkedinProfileSchema.safeParse({
            fullName: "Test",
            headline: null,
            location: null,
            connections: null,
            summary: null,
            profileUrl: null,
            totalYearsOfExperience: null,
            mostRecentJobTitle: null,
            roles: [],
            skills: {
                languages: [],
                frameworks: [],
                databases: [],
                cloudAndInfra: [],
                tools: [],
                other: [],
            },
            topSkills: [],
            endorsedSkills: [],
            education: [],
            certifications: [],
            spokenLanguages: [],
            recommendations: [],
            volunteerExperience: [],
            courses: [],
            projects: [],
            publications: [],
        });
        expect(result.success).toBe(true);
    });

    it("accepts null endorsements on endorsedSkill", () => {
        const result = linkedinProfileSchema.safeParse({
            fullName: "Test",
            headline: null,
            location: null,
            connections: null,
            summary: null,
            profileUrl: null,
            totalYearsOfExperience: null,
            mostRecentJobTitle: null,
            roles: [],
            skills: {
                languages: [],
                frameworks: [],
                databases: [],
                cloudAndInfra: [],
                tools: [],
                other: [],
            },
            topSkills: [],
            endorsedSkills: [{ name: "TypeScript", endorsements: null }],
            education: [],
            certifications: [],
            spokenLanguages: [],
            recommendations: [],
            volunteerExperience: [],
            courses: [],
            projects: [],
            publications: [],
        });
        expect(result.success).toBe(true);
        expect(result.data?.endorsedSkills[0]?.endorsements).toBeNull();
    });
});

describe("jobDescriptionSchema — boundary values", () => {
    it("accepts empty arrays for skills and responsibilities", () => {
        const result = jobDescriptionSchema.safeParse(baseJob);
        expect(result.success).toBe(true);
    });

    it("accepts very long string fields", () => {
        const longStr = "A".repeat(10000);
        const result = jobDescriptionSchema.safeParse({
            ...baseJob,
            title: longStr,
            domain: longStr,
        });
        expect(result.success).toBe(true);
    });

    it("rejects invalid seniority level enum value", () => {
        const result = jobDescriptionSchema.safeParse({
            ...baseJob,
            seniorityLevel: "über-senior",
        });
        expect(result.success).toBe(false);
    });

    it("accepts all valid seniority levels", () => {
        for (const level of [
            "junior",
            "mid",
            "senior",
            "staff",
            "principal",
        ] as const) {
            const result = jobDescriptionSchema.safeParse({
                ...baseJob,
                seniorityLevel: level,
            });
            expect(result.success).toBe(true);
        }
    });

    it("accepts null for optional fields", () => {
        const result = jobDescriptionSchema.safeParse({
            ...baseJob,
            company: null,
            seniorityLevel: null,
            minYearsExperience: null,
            domain: null,
        });
        expect(result.success).toBe(true);
    });

    it("accepts zero minYearsExperience", () => {
        const result = jobDescriptionSchema.safeParse({
            ...baseJob,
            minYearsExperience: 0,
        });
        expect(result.success).toBe(true);
    });

    it("accepts large minYearsExperience", () => {
        const result = jobDescriptionSchema.safeParse({
            ...baseJob,
            minYearsExperience: 100,
        });
        expect(result.success).toBe(true);
    });
});

describe("githubProfileSchema — boundary values", () => {
    it("accepts all null nullable fields", () => {
        const result = githubProfileSchema.safeParse(baseGitHub);
        expect(result.success).toBe(true);
    });

    it("accepts zero followers and following", () => {
        const result = githubProfileSchema.safeParse(baseGitHub);
        expect(result.success).toBe(true);
        expect(result.data?.followers).toBe(0);
        expect(result.data?.following).toBe(0);
    });

    it("accepts empty pinned repos", () => {
        const result = githubProfileSchema.safeParse(baseGitHub);
        expect(result.success).toBe(true);
        expect(result.data?.pinnedRepos).toEqual([]);
    });

    it("accepts a repo with null readme and null primaryLanguage", () => {
        const result = githubProfileSchema.safeParse({
            ...baseGitHub,
            pinnedRepos: [
                {
                    name: "test-repo",
                    description: null,
                    primaryLanguage: null,
                    url: "https://github.com/u/test-repo",
                    readme: null,
                },
            ],
        });
        expect(result.success).toBe(true);
    });

    it("accepts very long readme text", () => {
        const result = githubProfileSchema.safeParse({
            ...baseGitHub,
            pinnedRepos: [
                {
                    name: "test-repo",
                    description: "A repo",
                    primaryLanguage: "TypeScript",
                    url: "https://github.com/u/test-repo",
                    readme: "X".repeat(100000),
                },
            ],
        });
        expect(result.success).toBe(true);
    });
});
