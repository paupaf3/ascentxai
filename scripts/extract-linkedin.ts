import 'dotenv/config';
import path from 'node:path';

import { extractLinkedInProfile } from '../src/modules/linkedin/profile-extractor';

async function main(): Promise<void> {
    const [, , rawPath] = process.argv;
    if (!rawPath) {
        console.error('Usage: npm run linkedin:extract -- <path-to-linkedin.pdf>');
        process.exit(1);
    }

    const filePath = path.resolve(process.cwd(), rawPath);
    const profile = await extractLinkedInProfile({ filePath });
    console.log(JSON.stringify(profile, null, 2));
}

main().catch((error: unknown) => {
    console.error('LinkedIn extraction failed:', error);
    process.exit(1);
});
