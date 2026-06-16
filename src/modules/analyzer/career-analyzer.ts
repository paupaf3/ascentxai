import { RunLogger } from "../../logger";
import { mastra } from "../../mastra";
import type { AnalysisTarget } from "../../types/analysis-target";
import type {
    JobDescription,
    MatchResult,
} from "../../types/job/job-description";
import type { LinkedInProfile } from "../../types/linkedin/linkedin-profile";
import { extractCandidateProfile } from "../candidate/profile-extractor";
import { fetchProfile } from "../github/github-client";
import { extractJobDescription } from "../job/job-extractor";
import { computeMatch } from "../job/matcher";
import { extractLinkedInProfile } from "../linkedin/profile-extractor";
import { buildPrompt } from "./prompt-builder";

export type { AnalysisTarget };

export async function analyze(
    resumePath: string,
    githubUsername: string,
    target: AnalysisTarget,
    linkedinPath: string
): Promise<string> {
    const logger = new RunLogger({
        resumePath,
        githubUsername,
        target,
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
        const jobStage =
            target.mode === "job"
                ? logger.startStage("job_extraction", {
                      input: target.jobInput.startsWith("http")
                          ? target.jobInput
                          : "<inline text>",
                  })
                : null;

        const linkedinPromise: Promise<LinkedInProfile | null> = linkedinPath
            ? extractLinkedInProfile({ filePath: linkedinPath })
                  .then((result) => {
                      logger.endStage(linkedinStage!, {
                          name: result.fullName,
                          connections: result.connections,
                      });
                      return result;
                  })
                  .catch((err: Error) => {
                      logger.failStage(linkedinStage!, err.message);
                      throw err;
                  })
            : Promise.resolve(null);

        const jobPromise: Promise<JobDescription | null> =
            target.mode === "job"
                ? extractJobDescription(target.jobInput)
                      .then((result) => {
                          logger.endStage(jobStage!, {
                              title: result.title,
                              company: result.company,
                              requiredSkillsCount: result.requiredSkills.length,
                              preferredSkillsCount:
                                  result.preferredSkills.length,
                          });
                          return result;
                      })
                      .catch((err: Error) => {
                          logger.failStage(jobStage!, err.message);
                          throw err;
                      })
                : Promise.resolve(null);

        const [profile, portfolio, linkedinProfile, jobDescription] =
            await Promise.all([
                extractCandidateProfile({ filePath: resumePath })
                    .then((result) => {
                        logger.endStage(resumeStage, {
                            candidateName: result.fullName,
                            topSkills: result.topSkills,
                            totalYearsOfExperience:
                                result.totalYearsOfExperience,
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
                jobPromise,
            ]);

        let matchResult: MatchResult | null = null;
        if (jobDescription) {
            const matchStage = logger.startStage("job_matching");
            matchResult = computeMatch(profile, portfolio, jobDescription);
            logger.endStage(matchStage, {
                overallScore: matchResult.overallScore,
                requiredSkillsScore: matchResult.requiredSkillsScore,
                missingRequiredCount: matchResult.missingRequired.length,
            });
        }

        const promptStage = logger.startStage("prompt_build");
        const prompt = buildPrompt(
            profile,
            portfolio,
            target,
            linkedinProfile,
            jobDescription,
            matchResult
        );
        logger.endStage(promptStage, { promptLength: prompt.length });

        const analysisStage = logger.startStage("agent_analysis", {
            model:
                process.env.ANALYSIS_MODEL?.trim() ??
                process.env.EXTRACTION_MODEL?.trim() ??
                "nvidia/llama-3.3-nemotron-super-49b-v1",
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
