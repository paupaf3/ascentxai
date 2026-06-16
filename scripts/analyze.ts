import "dotenv/config";
import path from "node:path";

import {
    analyze,
    type AnalysisTarget,
} from "../src/modules/analyzer/career-analyzer";

async function main(): Promise<void> {
    const rawArgs = process.argv.slice(2);

    // Extract --job flag (takes priority over JOB_INPUT env var)
    let jobInput: string | undefined;
    const jobFlagIndex = rawArgs.indexOf("--job");
    if (jobFlagIndex !== -1) {
        jobInput = rawArgs[jobFlagIndex + 1];
        if (!jobInput || jobInput.startsWith("--")) {
            console.error(
                "Error: --job requires a value (URL or job description text)."
            );
            process.exit(1);
        }
        rawArgs.splice(jobFlagIndex, 2);
    } else if (process.env.JOB_INPUT) {
        jobInput = process.env.JOB_INPUT;
    }

    const [rawResumePath, githubUsername, ...rest] = rawArgs;

    if (!rawResumePath || !githubUsername) {
        console.error(
            "Usage:\n" +
                '  Goal mode: npm run analyze -- <resume.pdf> <github-username> [linkedin.pdf] "<career goal>"\n' +
                "  Job mode:  npm run analyze -- <resume.pdf> <github-username> [linkedin.pdf] --job <url-or-text>"
        );
        process.exit(1);
    }

    // Optional LinkedIn PDF is the first remaining arg if it ends in .pdf
    let rawLinkedInPath: string | undefined;
    let goalParts: string[];

    if (rest[0]?.toLowerCase().endsWith(".pdf")) {
        [rawLinkedInPath, ...goalParts] = rest;
    } else {
        goalParts = rest;
    }

    // Mutual exclusivity: require exactly one of goal or --job
    const hasGoal = goalParts.length > 0;
    const hasJob = jobInput !== undefined;

    if (hasGoal && hasJob) {
        console.error(
            "Error: provide either a career goal or --job, not both."
        );
        process.exit(1);
    }

    if (!hasGoal && !hasJob) {
        console.error(
            "Error: a career goal or --job is required.\n" +
                '  Goal mode: npm run analyze -- <resume.pdf> <github-username> [linkedin.pdf] "<career goal>"\n' +
                "  Job mode:  npm run analyze -- <resume.pdf> <github-username> [linkedin.pdf] --job <url-or-text>"
        );
        process.exit(1);
    }

    const target: AnalysisTarget = hasJob
        ? { mode: "job", jobInput: jobInput! }
        : { mode: "goal", goal: goalParts.join(" ") };

    const resumePath = path.resolve(process.cwd(), rawResumePath);
    const linkedinPath = rawLinkedInPath
        ? path.resolve(process.cwd(), rawLinkedInPath)
        : "";

    console.log(`Resume:   ${resumePath}`);
    console.log(`GitHub:   ${githubUsername}`);
    if (linkedinPath) console.log(`LinkedIn: ${linkedinPath}`);
    if (target.mode === "goal") {
        console.log(`Goal:     ${target.goal}`);
    } else {
        const isUrl = target.jobInput.startsWith("http");
        if (isUrl) {
            const url = new URL(target.jobInput);
            console.log(`Job URL:  ${url.hostname}${url.pathname}`);
        } else {
            const truncated =
                target.jobInput.length > 80
                    ? target.jobInput.slice(0, 77) + "..."
                    : target.jobInput;
            console.log(`Job:      ${truncated}`);
        }
    }
    console.log("─".repeat(60));
    console.log("Running analysis...\n");

    const analysis = await analyze(
        resumePath,
        githubUsername,
        target,
        linkedinPath
    );

    console.log(analysis);
}

main().catch((error: unknown) => {
    console.error(
        "Analysis failed:",
        error instanceof Error ? error.message : error
    );
    process.exit(1);
});
