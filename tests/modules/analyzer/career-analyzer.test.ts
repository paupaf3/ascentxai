import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fullCandidateFixture } from '../candidate/fixtures/profile.fixture';
import { profileFixture } from '../github/fixtures/profile.fixture';
import { fullLinkedInFixture } from '../linkedin/fixtures/profile.fixture';

const { generateMock, getAgentMock, MockRunLogger } = vi.hoisted(() => {
    const generate = vi.fn();
    const loggerInstance = {
        runId: 'test-run',
        logFile: '/tmp/test.json',
        startStage: vi.fn().mockReturnValue({ name: 'stage', startedAt: '', status: 'running' }),
        endStage: vi.fn(),
        failStage: vi.fn(),
        finish: vi.fn(),
        fail: vi.fn(),
    };
    return {
        generateMock: generate,
        getAgentMock: vi.fn(() => ({ generate })),
        MockRunLogger: vi.fn(function() { return loggerInstance; }),
    };
});

vi.mock('../../../src/mastra', () => ({
    mastra: { getAgent: getAgentMock },
}));

vi.mock('../../../src/modules/candidate/profile-extractor', () => ({
    extractCandidateProfile: vi.fn(),
}));

vi.mock('../../../src/modules/github/github-client', () => ({
    fetchProfile: vi.fn(),
}));

vi.mock('../../../src/modules/linkedin/profile-extractor', () => ({
    extractLinkedInProfile: vi.fn(),
}));

vi.mock('../../../src/modules/analyzer/prompt-builder', () => ({
    buildPrompt: vi.fn(() => 'ASSEMBLED PROMPT'),
}));

vi.mock('../../../src/logger', () => ({
    RunLogger: MockRunLogger,
}));

import { analyze } from '../../../src/modules/analyzer/career-analyzer';
import { extractCandidateProfile } from '../../../src/modules/candidate/profile-extractor';
import { fetchProfile } from '../../../src/modules/github/github-client';
import { extractLinkedInProfile } from '../../../src/modules/linkedin/profile-extractor';
import { buildPrompt } from '../../../src/modules/analyzer/prompt-builder';

const mockedExtract = extractCandidateProfile as ReturnType<typeof vi.fn>;
const mockedFetch = fetchProfile as ReturnType<typeof vi.fn>;
const mockedExtractLinkedIn = extractLinkedInProfile as ReturnType<typeof vi.fn>;
const mockedBuildPrompt = buildPrompt as ReturnType<typeof vi.fn>;

const GOAL = 'Staff Engineer at a B2B SaaS company';
const TARGET_GOAL = { mode: 'goal' as const, goal: GOAL };
const ANALYSIS = '## Current Standing\nStrong backend...\n## Technical Blind Spots\n1. ...\n## The Level-Up Roadmap\nBuild...';

beforeEach(() => {
    vi.clearAllMocks();
    mockedExtract.mockResolvedValue(fullCandidateFixture);
    mockedFetch.mockResolvedValue(profileFixture);
    mockedExtractLinkedIn.mockResolvedValue(fullLinkedInFixture);
    generateMock.mockResolvedValue({ text: ANALYSIS });
});

describe('analyze', () => {
    it('calls extractCandidateProfile and fetchProfile in parallel', async () => {
        await analyze('/tmp/resume.pdf', 'testuser', TARGET_GOAL);

        expect(mockedExtract).toHaveBeenCalledWith({ filePath: '/tmp/resume.pdf' });
        expect(mockedFetch).toHaveBeenCalledWith('testuser');
    });

    it('passes profile and portfolio to buildPrompt with null linkedin when omitted', async () => {
        await analyze('/tmp/resume.pdf', 'testuser', TARGET_GOAL);

        expect(mockedBuildPrompt).toHaveBeenCalledWith(
            fullCandidateFixture,
            profileFixture,
            TARGET_GOAL,
            null,
            null,
            null,
        );
        expect(mockedExtractLinkedIn).not.toHaveBeenCalled();
    });

    it('extracts LinkedIn and passes it to buildPrompt when a path is supplied', async () => {
        await analyze('/tmp/resume.pdf', 'testuser', TARGET_GOAL, '/tmp/linkedin.pdf');

        expect(mockedExtractLinkedIn).toHaveBeenCalledWith({ filePath: '/tmp/linkedin.pdf' });
        expect(mockedBuildPrompt).toHaveBeenCalledWith(
            fullCandidateFixture,
            profileFixture,
            TARGET_GOAL,
            fullLinkedInFixture,
            null,
            null,
        );
    });

    it('sends the assembled prompt to the career analysis agent', async () => {
        await analyze('/tmp/resume.pdf', 'testuser', TARGET_GOAL);

        expect(getAgentMock).toHaveBeenCalledWith('careerAnalysisAgent');
        const messages = generateMock.mock.calls[0]?.[0];
        expect(messages[0].content).toBe('ASSEMBLED PROMPT');
    });

    it('returns the analysis text from the agent', async () => {
        const result = await analyze('/tmp/resume.pdf', 'testuser', TARGET_GOAL);
        expect(result).toBe(ANALYSIS);
    });

    it('throws when the agent returns empty text', async () => {
        generateMock.mockResolvedValueOnce({ text: '' });
        await expect(analyze('/tmp/resume.pdf', 'testuser', TARGET_GOAL)).rejects.toThrow(
            'Career analysis agent returned an empty response.',
        );
    });

    it('propagates errors from extractCandidateProfile', async () => {
        mockedExtract.mockRejectedValueOnce(new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set'));
        await expect(analyze('/tmp/resume.pdf', 'testuser', TARGET_GOAL)).rejects.toThrow(
            'GOOGLE_GENERATIVE_AI_API_KEY is not set',
        );
    });

    it('propagates errors from fetchProfile', async () => {
        mockedFetch.mockRejectedValueOnce(new Error('GitHub user "testuser" not found'));
        await expect(analyze('/tmp/resume.pdf', 'testuser', TARGET_GOAL)).rejects.toThrow(
            'GitHub user "testuser" not found',
        );
    });

    it('propagates errors from extractLinkedInProfile', async () => {
        mockedExtractLinkedIn.mockRejectedValueOnce(new Error('PDF has no extractable text'));
        await expect(
            analyze('/tmp/resume.pdf', 'testuser', TARGET_GOAL, '/tmp/linkedin.pdf'),
        ).rejects.toThrow('PDF has no extractable text');
    });
});
