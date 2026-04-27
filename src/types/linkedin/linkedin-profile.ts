import { z } from 'zod';

import {
    certificationSchema,
    educationEntrySchema,
    roleSchema,
    skillsSchema,
    spokenLanguageSchema,
} from '../candidate/profile';

export const endorsedSkillSchema = z.object({
    name: z.string().describe('Canonical skill name (e.g. "TypeScript", not "TS").'),
    endorsements: z.number().nullable().describe('Number of endorsements shown on LinkedIn.'),
});

export const recommendationSchema = z.object({
    recommenderName: z.string(),
    recommenderTitle: z.string().nullable().describe('Title and company of the recommender at the time.'),
    text: z.string().describe("Full text of the recommendation."),
});

export const volunteerExperienceSchema = z.object({
    title: z.string().nullable(),
    organization: z.string().nullable(),
    startDate: z.string().nullable().describe('YYYY or YYYY-MM, or null.'),
    endDate: z.string().nullable().describe('YYYY, YYYY-MM, "present", or null.'),
    description: z.string().nullable(),
});

export const courseSchema = z.object({
    name: z.string(),
    associatedWith: z.string().nullable().describe('Institution or organization the course is associated with.'),
});

export const projectSchema = z.object({
    name: z.string(),
    startDate: z.string().nullable().describe('YYYY or YYYY-MM, or null.'),
    endDate: z.string().nullable().describe('YYYY, YYYY-MM, "present", or null.'),
    description: z.string().nullable(),
});

export const publicationSchema = z.object({
    title: z.string(),
    publisher: z.string().nullable(),
    date: z.string().nullable().describe('YYYY or YYYY-MM, or null.'),
    description: z.string().nullable(),
});

/**
 * LinkedIn PDF export schema.
 *
 * Reuses the core professional sub-schemas from CandidateProfile (roles,
 * skills, education, certifications, languages) and adds LinkedIn-specific
 * sections: endorsed skills with counts, recommendations, volunteer work,
 * courses, projects, and publications.
 */
export const linkedinProfileSchema = z.object({
    fullName: z.string().nullable(),
    headline: z.string().nullable().describe('Professional tagline shown below the name on LinkedIn.'),
    location: z.string().nullable(),
    connections: z.number().nullable().describe('Approximate connection count (e.g. LinkedIn shows "500+", use 500).'),
    summary: z.string().nullable().describe('About section text.'),
    profileUrl: z.string().nullable().describe('LinkedIn profile URL if printed in the export.'),

    totalYearsOfExperience: z.number().nullable().describe(
        'Total professional experience in years from non-overlapping role periods.',
    ),
    mostRecentJobTitle: z.string().nullable(),
    roles: z.array(roleSchema).describe('All professional roles, most recent first.'),

    skills: skillsSchema.describe('Aggregated skill taxonomy, normalized and deduplicated.'),
    topSkills: z.array(z.string()).max(5).describe(
        'Up to five highest-signal skills for quick comparison against a career goal.',
    ),
    endorsedSkills: z.array(endorsedSkillSchema).describe(
        'Skills listed with endorsement counts in the Skills section.',
    ),

    education: z.array(educationEntrySchema),
    certifications: z.array(certificationSchema),
    spokenLanguages: z.array(spokenLanguageSchema),

    recommendations: z.array(recommendationSchema).describe('Recommendations received section.'),
    volunteerExperience: z.array(volunteerExperienceSchema),
    courses: z.array(courseSchema),
    projects: z.array(projectSchema),
    publications: z.array(publicationSchema),
});

export type EndorsedSkill = z.infer<typeof endorsedSkillSchema>;
export type Recommendation = z.infer<typeof recommendationSchema>;
export type VolunteerExperience = z.infer<typeof volunteerExperienceSchema>;
export type Course = z.infer<typeof courseSchema>;
export type Project = z.infer<typeof projectSchema>;
export type Publication = z.infer<typeof publicationSchema>;
export type LinkedInProfile = z.infer<typeof linkedinProfileSchema>;
