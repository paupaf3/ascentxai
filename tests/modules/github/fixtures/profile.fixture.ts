import { GithubProfile } from "../../../../src/types/github/github";
import { repoFixture } from "./repo.fixture";

export const profileFixture: GithubProfile = {
    username: "testuser",
    name: "Test User",
    bio: "A software engineer",
    location: "Barcelona",
    company: "Acme Corp",
    websiteUrl: "https://testuser.dev",
    avatarUrl: "https://avatars.githubusercontent.com/u/123456",
    followers: 100,
    following: 50,
    pinnedRepos: [repoFixture],
};
