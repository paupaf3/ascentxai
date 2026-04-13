export interface GithubRepo {
    name: string;
    description: string | null;
    primaryLanguage: string | null;
    url: string;
    readme: string | null;
}

export interface GithubProfile {
    username: string;
    name: string | null;
    bio: string | null;
    location: string | null;
    company: string | null;
    websiteUrl: string | null;
    avatarUrl: string;
    followers: number;
    following: number;
    pinnedRepos: GithubRepo[];
}
