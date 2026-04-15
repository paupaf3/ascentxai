import { describe, it, expect } from "vitest";

import {
    candidateProfileSchema,
    roleSchema,
} from "../../../src/types/resume/candidate";

const baseProfile = {
    fullName: "Ada Lovelace",
    email: "ada@example.com",
    phone: null,
    location: "London, UK",
    headline: "Software Engineer",
    summary: null,
    links: { github: "https://github.com/ada", linkedin: null, website: null },
    totalYearsOfExperience: 3,
    mostRecentJobTitle: "Senior Engineer",
    roles: [
        {
            title: "Senior Engineer",
            company: "Acme",
            location: "Remote",
            startDate: "2022-01",
            endDate: "present",
            yearsInRole: 3,
            summary: "Led platform work.",
            technologies: ["TypeScript", "Node.js"],
        },
    ],
    skills: {
        languages: ["TypeScript", "Python"],
        frameworks: ["React"],
        databases: ["PostgreSQL"],
        cloudAndInfra: ["AWS"],
        tools: ["Docker"],
        other: [],
    },
    topSkills: ["TypeScript", "React", "Node.js"],
    education: [],
    certifications: [],
    spokenLanguages: [],
};

describe("candidateProfileSchema", () => {
    it("accepts a fully populated profile", () => {
        const parsed = candidateProfileSchema.parse(baseProfile);
        expect(parsed.fullName).toBe("Ada Lovelace");
        expect(parsed.roles[0]?.technologies).toContain("TypeScript");
    });

    it("accepts nulls for missing fields instead of empty strings", () => {
        const parsed = candidateProfileSchema.parse({
            ...baseProfile,
            fullName: null,
            email: null,
            totalYearsOfExperience: null,
        });
        expect(parsed.fullName).toBeNull();
        expect(parsed.email).toBeNull();
        expect(parsed.totalYearsOfExperience).toBeNull();
    });

    it("rejects more than five topSkills", () => {
        const result = candidateProfileSchema.safeParse({
            ...baseProfile,
            topSkills: ["a", "b", "c", "d", "e", "f"],
        });
        expect(result.success).toBe(false);
    });

    it("rejects an invalid date format on a role", () => {
        const result = roleSchema.safeParse({
            ...baseProfile.roles[0],
            startDate: "January 2022",
        });
        expect(result.success).toBe(false);
    });

    it('accepts "present" as an end date', () => {
        const result = roleSchema.safeParse({
            ...baseProfile.roles[0],
            endDate: "present",
        });
        expect(result.success).toBe(true);
    });

    it("requires every skill bucket to be present (even if empty)", () => {
        const result = candidateProfileSchema.safeParse({
            ...baseProfile,
            skills: { languages: [] },
        });
        expect(result.success).toBe(false);
    });
});
