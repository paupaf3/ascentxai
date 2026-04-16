import { z } from 'zod';

/**
 * Public-facing GitHub schemas — the cleaned, mapped shape consumed by the
 * rest of the application. Defined as Zod schemas so the runtime boundary
 * between the GraphQL response and the domain model is enforced, mirroring
 * the candidate profile pipeline.
 */

export const githubRepoSchema = z.object({
    name: z.string(),
    description: z.string().nullable(),
    primaryLanguage: z
        .string()
        .nullable()
        .describe(
            'Canonical language name as reported by GitHub (e.g. "TypeScript"). Compared directly against CandidateProfile skill names.',
        ),
    url: z.string(),
    readme: z.string().nullable(),
});

export const githubProfileSchema = z.object({
    username: z.string(),
    name: z.string().nullable(),
    bio: z.string().nullable(),
    location: z.string().nullable(),
    company: z.string().nullable(),
    websiteUrl: z.string().nullable(),
    avatarUrl: z.string(),
    followers: z.number(),
    following: z.number(),
    pinnedRepos: z.array(githubRepoSchema),
});

export type GithubRepo = z.infer<typeof githubRepoSchema>;
export type GithubProfile = z.infer<typeof githubProfileSchema>;
