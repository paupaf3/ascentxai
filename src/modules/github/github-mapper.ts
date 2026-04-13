import { GithubRepo } from "../../types/github/github";
import { GithubRawRepo } from "../../types/github/github-response";

export function mapRepo(raw: GithubRawRepo): GithubRepo {
    return {
        name: raw.name,
        description: raw.description,
        primaryLanguage: raw.primaryLanguage?.name ?? null,
        url: raw.url,
        readme: raw.object?.text ?? null,
    };
}
