/**
 * github-test.ts
 *
 * Manual test CLI for the GitHub module.
 * Not part of the production build — dev use only.
 *
 * Usage:
 *   npx ts-node scripts/github-test.ts profile <username>
 *   npx ts-node scripts/github-test.ts repo <owner/repo>
 */

import "dotenv/config";
import {
    fetchProfile,
    fetchRepo,
    fetchRepoBySlug,
} from "../src/modules/github/github-client";
import { GithubProfile, GithubRepo } from "../src/types/github/github";

// ---------------------------------------------------------------------------
// Printers
// ---------------------------------------------------------------------------

function printSeparator(label: string): void {
    const line = "─".repeat(60);
    console.log(`\n${line}`);
    console.log(` ${label}`);
    console.log(`${line}`);
}

function printProfile(profile: GithubProfile): void {
    printSeparator("PROFILE");
    console.log(`Username  : ${profile.username}`);
    console.log(`Name      : ${profile.name ?? "—"}`);
    console.log(`Bio       : ${profile.bio ?? "—"}`);
    console.log(`Location  : ${profile.location ?? "—"}`);
    console.log(`Company   : ${profile.company ?? "—"}`);
    console.log(`Website   : ${profile.websiteUrl ?? "—"}`);
    console.log(`Followers : ${profile.followers}`);
    console.log(`Following : ${profile.following}`);

    printSeparator(`PINNED REPOS (${profile.pinnedRepos.length})`);

    if (profile.pinnedRepos.length === 0) {
        console.log("No pinned repositories found.");
        return;
    }

    profile.pinnedRepos.forEach((repo, index) => {
        console.log(`\n[${index + 1}] ${repo.name}`);
        printRepo(repo, false);
    });
}

function printRepo(repo: GithubRepo, withHeader = true): void {
    if (withHeader) {
        printSeparator(`REPO: ${repo.name}`);
    }
    console.log(`  Description : ${repo.description ?? "—"}`);
    console.log(`  Language    : ${repo.primaryLanguage ?? "—"}`);
    console.log(`  URL         : ${repo.url}`);
    console.log(
        `  README      : ${repo.readme ? `${repo.readme.slice(0, 120).trim()}...` : "—"}`
    );
}

// ---------------------------------------------------------------------------
// Commands
// ---------------------------------------------------------------------------

async function runProfile(username: string): Promise<void> {
    console.log(`\nFetching profile for "${username}"...`);
    const profile = await fetchProfile(username);
    printProfile(profile);
}

async function runRepo(slug: string): Promise<void> {
    console.log(`\nFetching repo "${slug}"...`);
    const repo = await fetchRepoBySlug(slug);
    printRepo(repo);
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
    const [, , command, argument] = process.argv;

    if (!command || !argument) {
        console.error(
            [
                "",
                "Usage:",
                "  npx ts-node scripts/github-test.ts profile <username>",
                "  npx ts-node scripts/github-test.ts repo <owner/repo>",
                "",
                "Examples:",
                "  npx ts-node scripts/github-test.ts profile torvalds",
                "  npx ts-node scripts/github-test.ts repo vercel/next.js",
                "",
            ].join("\n")
        );
        process.exit(1);
    }

    switch (command) {
        case "profile":
            await runProfile(argument);
            break;

        case "repo":
            await runRepo(argument);
            break;

        default:
            console.error(
                `Unknown command "${command}". Use "profile" or "repo".`
            );
            process.exit(1);
    }
}

main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`\nError: ${message}`);
    process.exit(1);
});
