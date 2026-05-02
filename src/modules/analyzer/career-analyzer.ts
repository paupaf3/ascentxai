import { mastra } from "../../mastra";
import { RunLogger } from "../../logger";
import type { LinkedInProfile } from "../../types/linkedin/linkedin-profile";
import { extractCandidateProfile } from "../candidate/profile-extractor";
import { fetchProfile } from "../github/github-client";
import { extractLinkedInProfile } from "../linkedin/profile-extractor";
import { buildPrompt } from "./prompt-builder";

/**
 * End-to-end career analysis orchestrator.
 *
 * Chains independent modules in parallel and returns the raw AI-generated
 * analysis string. LinkedIn is optional: when a path is supplied it is
 * extracted alongside the resume and GitHub; when omitted the analysis
 * falls back to two data sources.
 */
export async function analyze(
    resumePath: string,
    githubUsername: string,
    goal: string,
    linkedinPath?: string
): Promise<string> {
    const logger = new RunLogger({
        resumePath,
        githubUsername,
        goal,
        linkedinPath,
    });
    console.log(`[run:${logger.runId}] log → ${logger.logFile}`);

    try {
        const resumeStage = logger.startStage("resume_extraction", {
            filePath: resumePath,
        });
        const githubStage = logger.startStage("github_fetch", {
            username: githubUsername,
        });
        const linkedinStage = linkedinPath
            ? logger.startStage("linkedin_extraction", {
                  filePath: linkedinPath,
              })
            : null;

        const linkedinPromise: Promise<LinkedInProfile | null> = linkedinPath
            ? extractLinkedInProfile({ filePath: linkedinPath })
                  .then((result) => {
                      logger.endStage(linkedinStage!, {
                          name: result.name,
                          connections: result.connections,
                      });
                      return result;
                  })
                  .catch((err: Error) => {
                      logger.failStage(linkedinStage!, err.message);
                      throw err;
                  })
            : Promise.resolve(null);

        const [profile, portfolio, linkedinProfile] = await Promise.all([
            extractCandidateProfile({ filePath: resumePath })
                .then((result) => {
                    logger.endStage(resumeStage, {
                        candidateName: result.name,
                        topSkills: result.topSkills,
                        totalYearsOfExperience: result.totalYearsOfExperience,
                    });
                    return result;
                })
                .catch((err: Error) => {
                    logger.failStage(resumeStage, err.message);
                    throw err;
                }),
            fetchProfile(githubUsername)
                .then((result) => {
                    logger.endStage(githubStage, {
                        name: result.name,
                        followers: result.followers,
                        pinnedReposCount: result.pinnedRepos.length,
                    });
                    return result;
                })
                .catch((err: Error) => {
                    logger.failStage(githubStage, err.message);
                    throw err;
                }),
            linkedinPromise,
        ]);

        const promptStage = logger.startStage("prompt_build");
        const prompt = buildPrompt(profile, portfolio, goal, linkedinProfile);
        logger.endStage(promptStage, { promptLength: prompt.length });

        const analysisStage = logger.startStage("agent_analysis", {
            model: process.env.GOOGLE_GENERATIVE_AI_MODEL ?? "gemini-2.5-flash",
        });

        const agent = mastra.getAgent("careerAnalysisAgent");
        const result = await agent.generate([
            { role: "user", content: prompt },
        ]);

        if (!result.text) {
            logger.failStage(
                analysisStage,
                "Agent returned an empty response."
            );
            logger.fail("Career analysis agent returned an empty response.");
            throw new Error(
                "Career analysis agent returned an empty response."
            );
        }

        logger.endStage(analysisStage, { outputLength: result.text.length });
        logger.finish(result.text.length);

        return result.text;
    } catch (err) {
        logger.fail(err instanceof Error ? err.message : String(err));
        throw err;
    }
}
