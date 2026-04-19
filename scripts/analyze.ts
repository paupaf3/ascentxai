import 'dotenv/config';
import path from 'node:path';

import { analyze } from '../src/modules/analyzer/career-analyzer';

async function main(): Promise<void> {
    const [, , rawPath, githubUsername, ...goalParts] = process.argv;

    if (!rawPath || !githubUsername || goalParts.length === 0) {
        console.error(
            'Usage: npx tsx scripts/analyze.ts <path-to-resume.pdf> <github-username> "<career goal>"',
        );
        process.exit(1);
    }

    const filePath = path.resolve(process.cwd(), rawPath);
    const goal = goalParts.join(' ');

    console.log(`Resume:  ${filePath}`);
    console.log(`GitHub:  ${githubUsername}`);
    console.log(`Goal:    ${goal}`);
    console.log('─'.repeat(60));
    console.log('Running analysis...\n');

    const analysis = await analyze(filePath, githubUsername, goal);

    console.log(analysis);
}

main().catch((error: unknown) => {
    console.error('Analysis failed:', error instanceof Error ? error.message : error);
    process.exit(1);
});
