export interface GithubRawRepo {
    name: string;
    description: string | null;
    url: string;
    primaryLanguage: { name: string } | null;
    object: { text: string } | null;
}

export interface GithubRawProfileResponse {
    user: {
        name: string | null;
        bio: string | null;
        location: string | null;
        company: string | null;
        websiteUrl: string | null;
        avatarUrl: string;
        followers: { totalCount: number };
        following: { totalCount: number };
        pinnedItems: { nodes: GithubRawRepo[] };
    } | null;
}

export interface GithubRawSingleRepoResponse {
    repository: GithubRawRepo | null;
}
