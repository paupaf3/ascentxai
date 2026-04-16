import { z } from 'zod';

/**
 * Candidate profile schema.
 *
 * The schema is shaped around AscentX's core use case: comparing a
 * candidate's CV against their GitHub footprint and a stated career goal.
 * That means the extracted data must be:
 *
 *   1. Granular per role — so per-role technologies can be cross-checked
 *      against the primary languages GitHub reports per repository.
 *   2. Normalized — skill names should be the canonical form
 *      (e.g. "JavaScript", not "JS") to line up with GitHub's
 *      `primaryLanguage` field and to deduplicate across roles.
 *   3. Explicit about missing data — nullable fields over invented values.
 */

const YEAR_OR_MONTH = z
    .string()
    .regex(
        /^(\d{4}(-\d{2})?|present)$/i,
        'Use YYYY, YYYY-MM, or the literal string "present".',
    );

export const roleSchema = z.object({
    title: z.string().nullable().describe('Job title held in this role.'),
    company: z.string().nullable().describe('Employer or client name.'),
    location: z.string().nullable().describe('City / country, or "remote".'),
    startDate: YEAR_OR_MONTH.nullable().describe(
        'Role start date as YYYY or YYYY-MM. Null if not present in the resume.',
    ),
    endDate: YEAR_OR_MONTH.nullable().describe(
        'Role end date as YYYY, YYYY-MM, or "present" for current roles.',
    ),
    yearsInRole: z
        .number()
        .nullable()
        .describe(
            'Duration of this specific role in years (fractional allowed, e.g. 1.5). Compute from startDate/endDate when possible.',
        ),
    summary: z
        .string()
        .nullable()
        .describe('One- or two-sentence summary of the role and impact.'),
    technologies: z
        .array(z.string())
        .describe(
            'Canonical names of technologies used in this role (languages, frameworks, tools). Used to cross-reference against GitHub activity.',
        ),
});

export const skillsSchema = z.object({
    languages: z
        .array(z.string())
        .describe(
            'Programming languages, canonical form (e.g. "JavaScript", "TypeScript", "Python"). Must align with GitHub primaryLanguage values.',
        ),
    frameworks: z
        .array(z.string())
        .describe('Frameworks and libraries (e.g. "React", "Next.js", "Django").'),
    databases: z.array(z.string()).describe('Databases and data stores.'),
    cloudAndInfra: z
        .array(z.string())
        .describe('Cloud providers, infra, DevOps tools (AWS, Docker, Kubernetes...).'),
    tools: z.array(z.string()).describe('Other notable tooling.'),
    other: z
        .array(z.string())
        .describe('Anything technical that does not fit the categories above.'),
});

export const educationEntrySchema = z.object({
    degree: z.string().nullable().describe('Name of the degree or certification.'),
    field: z.string().nullable().describe('Field of study.'),
    institution: z.string().nullable().describe('Name of the school or university.'),
    startYear: z.string().nullable().describe('Start year as YYYY, or null.'),
    endYear: z
        .string()
        .nullable()
        .describe('End / graduation year as YYYY, or null if not present.'),
});

export const certificationSchema = z.object({
    name: z.string(),
    issuer: z.string().nullable(),
    year: z.string().nullable(),
});

export const spokenLanguageSchema = z.object({
    language: z.string(),
    proficiency: z
        .string()
        .nullable()
        .describe('CEFR level or self-reported proficiency (e.g. "C1", "native").'),
});

export const candidateLinksSchema = z.object({
    github: z
        .string()
        .nullable()
        .describe('GitHub profile URL or username, if present anywhere in the resume.'),
    linkedin: z.string().nullable().describe('LinkedIn profile URL, if present.'),
    website: z.string().nullable().describe('Personal site or portfolio URL.'),
});

export const candidateProfileSchema = z.object({
    fullName: z.string().nullable(),
    email: z.string().nullable(),
    phone: z.string().nullable(),
    location: z.string().nullable(),
    headline: z
        .string()
        .nullable()
        .describe('Short professional tagline or current-role headline.'),
    summary: z
        .string()
        .nullable()
        .describe('Professional summary paragraph from the top of the resume.'),
    links: candidateLinksSchema,
    totalYearsOfExperience: z
        .number()
        .nullable()
        .describe(
            'Total professional experience in years, calculated from the non-overlapping sum of role durations.',
        ),
    mostRecentJobTitle: z.string().nullable(),
    roles: z
        .array(roleSchema)
        .describe(
            'All professional roles, ordered most recent first. Each role carries its own duration and technology list.',
        ),
    skills: skillsSchema.describe(
        'Aggregated skill taxonomy across the whole resume, normalized and deduplicated.',
    ),
    topSkills: z
        .array(z.string())
        .max(5)
        .describe(
            'Up to five highest-signal technical skills for quick comparison against a career goal.',
        ),
    education: z.array(educationEntrySchema),
    certifications: z.array(certificationSchema),
    spokenLanguages: z.array(spokenLanguageSchema),
});

export type Role = z.infer<typeof roleSchema>;
export type CandidateSkills = z.infer<typeof skillsSchema>;
export type EducationEntry = z.infer<typeof educationEntrySchema>;
export type Certification = z.infer<typeof certificationSchema>;
export type SpokenLanguage = z.infer<typeof spokenLanguageSchema>;
export type CandidateLinks = z.infer<typeof candidateLinksSchema>;
export type CandidateProfile = z.infer<typeof candidateProfileSchema>;
