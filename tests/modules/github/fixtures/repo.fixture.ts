import { GithubRepo } from "../../../../src/types/github/github";

export const repoFixture: GithubRepo = {
    name: "awesome-project",
    description: "A test repository",
    primaryLanguage: "TypeScript",
    url: "https://github.com/testuser/awesome-project",
    readme: "# Awesome Project\nThis is a test readme.",
};

export const repoNoReadmeFixture: GithubRepo = {
    name: "empty-project",
    description: null,
    primaryLanguage: null,
    url: "https://github.com/testuser/empty-project",
    readme: null,
};
