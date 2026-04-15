import 'dotenv/config';
import path from 'node:path';

import { extractCandidateProfile } from '../src/modules/resume/candidate-extractor';

async function main(): Promise<void> {
    const [, , rawPath] = process.argv;
    if (!rawPath) {
        console.error('Usage: npm run resume:extract -- <path-to-resume.pdf>');
        process.exit(1);
    }

    const filePath = path.resolve(process.cwd(), rawPath);
    const profile = await extractCandidateProfile({ filePath });
    console.log(JSON.stringify(profile, null, 2));
}

main().catch((error: unknown) => {
    console.error('Resume extraction failed:', error);
    process.exit(1);
});
