import 'dotenv/config';
import path from 'node:path';

import { analyze } from '../src/modules/analyzer/career-analyzer';

async function main(): Promise<void> {
    const args = process.argv.slice(2);
    const [rawResumePath, githubUsername, ...rest] = args;

    if (!rawResumePath || !githubUsername || rest.length === 0) {
        console.error(
            'Usage: npm run analyze -- <resume.pdf> <github-username> [linkedin.pdf] "<career goal>"',
        );
        process.exit(1);
    }

    // If the third argument looks like a PDF path, treat it as the LinkedIn export.
    let rawLinkedInPath: string | undefined;
    let goalParts: string[];

    if (rest[0]?.toLowerCase().endsWith('.pdf')) {
        [rawLinkedInPath, ...goalParts] = rest;
    } else {
        goalParts = rest;
    }

    if (goalParts.length === 0) {
        console.error('Error: career goal is required.');
        process.exit(1);
    }

    const resumePath = path.resolve(process.cwd(), rawResumePath);
    const linkedinPath = rawLinkedInPath
        ? path.resolve(process.cwd(), rawLinkedInPath)
        : undefined;
    const goal = goalParts.join(' ');

    console.log(`Resume:   ${resumePath}`);
    console.log(`GitHub:   ${githubUsername}`);
    if (linkedinPath) console.log(`LinkedIn: ${linkedinPath}`);
    console.log(`Goal:     ${goal}`);
    console.log('─'.repeat(60));
    console.log('Running analysis...\n');

    const analysis = await analyze(resumePath, githubUsername, goal, linkedinPath);

    console.log(analysis);
}

main().catch((error: unknown) => {
    console.error('Analysis failed:', error instanceof Error ? error.message : error);
    process.exit(1);
});
