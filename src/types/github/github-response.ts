import { z } from 'zod';

/**
 * Raw GitHub GraphQL response schemas. Validated at runtime so silent API
 * drift (renamed fields, new nullability) surfaces as a clear error rather
 * than `undefined` propagating into the mapper.
 */

export const githubRawRepoSchema = z.object({
    name: z.string(),
    description: z.string().nullable(),
    url: z.string(),
    primaryLanguage: z.object({ name: z.string() }).nullable(),
    object: z.object({ text: z.string() }).nullable(),
});

export const githubRawProfileResponseSchema = z.object({
    user: z
        .object({
            name: z.string().nullable(),
            bio: z.string().nullable(),
            location: z.string().nullable(),
            company: z.string().nullable(),
            websiteUrl: z.string().nullable(),
            avatarUrl: z.string(),
            followers: z.object({ totalCount: z.number() }),
            following: z.object({ totalCount: z.number() }),
            pinnedItems: z.object({ nodes: z.array(githubRawRepoSchema) }),
        })
        .nullable(),
});

export const githubRawSingleRepoResponseSchema = z.object({
    repository: githubRawRepoSchema.nullable(),
});

export type GithubRawRepo = z.infer<typeof githubRawRepoSchema>;
export type GithubRawProfileResponse = z.infer<
    typeof githubRawProfileResponseSchema
>;
export type GithubRawSingleRepoResponse = z.infer<
    typeof githubRawSingleRepoResponseSchema
>;
