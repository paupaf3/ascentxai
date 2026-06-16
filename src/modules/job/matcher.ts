import type { CandidateProfile } from "../../types/candidate/profile";
import type { GithubProfile } from "../../types/github/github";
import type {
    JobDescription,
    MatchResult,
    SkillMatch,
} from "../../types/job/job-description";

function normalize(skill: string): string {
    return skill.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function buildCandidateSkillSet(
    profile: CandidateProfile,
    portfolio: GithubProfile
): Set<string> {
    const all: string[] = [
        ...profile.skills.languages,
        ...profile.skills.frameworks,
        ...profile.skills.databases,
        ...profile.skills.cloudAndInfra,
        ...profile.skills.tools,
        ...profile.skills.other,
        ...profile.topSkills,
        ...portfolio.pinnedRepos.map((r) => r.primaryLanguage ?? ""),
    ];
    return new Set(all.filter(Boolean).map(normalize));
}

function techDepthScore(
    skill: string,
    profile: CandidateProfile,
    portfolio: GithubProfile
): number {
    const key = normalize(skill);

    const allResumeSkills = [
        ...profile.skills.languages,
        ...profile.skills.frameworks,
        ...profile.skills.databases,
        ...profile.skills.cloudAndInfra,
        ...profile.skills.tools,
        ...profile.skills.other,
    ].map(normalize);

    const inResume = allResumeSkills.includes(key);

    const repoMatches = portfolio.pinnedRepos.filter(
        (r) =>
            normalize(r.primaryLanguage ?? "") === key ||
            normalize(r.description ?? "").includes(key) ||
            normalize(r.name).includes(key)
    ).length;

    if (!inResume && repoMatches === 0) return 0;
    if (inResume && repoMatches === 0) return 1;
    if (inResume && repoMatches === 1) return 2;
    return 3;
}

export function computeMatch(
    profile: CandidateProfile,
    portfolio: GithubProfile,
    job: JobDescription
): MatchResult {
    const candidateSkills = buildCandidateSkillSet(profile, portfolio);

    // Required skills
    const matchedRequired: SkillMatch[] = [];
    const missingRequired: string[] = [];

    for (const skill of job.requiredSkills) {
        if (candidateSkills.has(normalize(skill))) {
            matchedRequired.push({
                skill,
                depth: techDepthScore(skill, profile, portfolio),
            });
        } else {
            missingRequired.push(skill);
        }
    }

    const requiredTotal = job.requiredSkills.length;
    const requiredSkillsScore =
        requiredTotal === 0 ? 1 : matchedRequired.length / requiredTotal;

    // Preferred skills
    const matchedPreferred = job.preferredSkills.filter((s) =>
        candidateSkills.has(normalize(s))
    );
    const preferredTotal = job.preferredSkills.length;
    const preferredSkillsScore =
        preferredTotal === 0 ? 1 : matchedPreferred.length / preferredTotal;

    // Experience
    const candidateYears = profile.totalYearsOfExperience ?? 0;
    const requiredYears = job.minYearsExperience ?? 0;
    const experienceScore =
        requiredYears === 0 ? 1 : Math.min(candidateYears / requiredYears, 1);

    // Tech depth (average across matched required skills, normalized to 0–1)
    const depthValues = matchedRequired.map((m) => m.depth / 3);
    const averageTechDepthScore =
        depthValues.length === 0
            ? 0
            : depthValues.reduce((a, b) => a + b, 0) / depthValues.length;

    // Weighted overall
    const overallScore =
        requiredSkillsScore * 0.45 +
        experienceScore * 0.25 +
        averageTechDepthScore * 0.2 +
        preferredSkillsScore * 0.1;

    return {
        overallScore: Math.round(overallScore * 100),
        requiredSkillsScore: Math.round(requiredSkillsScore * 100),
        preferredSkillsScore: Math.round(preferredSkillsScore * 100),
        experienceScore: Math.round(experienceScore * 100),
        averageTechDepthScore: Math.round(averageTechDepthScore * 100),
        matchedRequired,
        missingRequired,
        matchedPreferred,
    };
}
