import { z } from "zod";

export const jobDescriptionSchema = z.object({
    title: z.string().describe("Job title exactly as written in the posting."),
    company: z.string().nullable().describe("Company name, or null if not found."),
    seniorityLevel: z
        .enum(["junior", "mid", "senior", "staff", "principal"])
        .nullable()
        .describe("Inferred seniority level from title and requirements."),
    minYearsExperience: z
        .number()
        .nullable()
        .describe("Minimum years of experience required, or null if not stated."),
    requiredSkills: z
        .array(z.string())
        .describe(
            "Must-have skills. Canonical names only (e.g. 'TypeScript', 'Kubernetes'). No duplicates."
        ),
    preferredSkills: z
        .array(z.string())
        .describe(
            "Nice-to-have skills. Canonical names only. No duplicates. Exclude anything already in requiredSkills."
        ),
    responsibilities: z
        .array(z.string())
        .describe("Top 5 key responsibilities, each as one short sentence."),
    domain: z
        .string()
        .nullable()
        .describe(
            "Business domain or industry (e.g. 'fintech', 'developer tooling', 'e-commerce'), or null if unclear."
        ),
});

export type JobDescription = z.infer<typeof jobDescriptionSchema>;

export interface SkillMatch {
    skill: string;
    depth: number;
}

export interface MatchResult {
    overallScore: number;
    requiredSkillsScore: number;
    preferredSkillsScore: number;
    experienceScore: number;
    techDepthScore: number;
    matchedRequired: SkillMatch[];
    missingRequired: string[];
    matchedPreferred: string[];
}
