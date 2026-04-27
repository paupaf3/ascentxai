import { Mastra } from '@mastra/core';

import { careerAnalysisAgent } from './modules/analyzer/analysis-agent';
import { candidateExtractionAgent } from './modules/candidate/extraction-agent';
import { linkedinExtractionAgent } from './modules/linkedin/extraction-agent';

/**
 * Central Mastra instance. Registering agents here enables Mastra's built-in
 * observability (traces, token accounting) and provides a single lookup
 * point for the rest of the application.
 */
export const mastra = new Mastra({
    agents: {
        candidateExtractionAgent,
        careerAnalysisAgent,
        linkedinExtractionAgent,
    },
});
