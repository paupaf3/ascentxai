import type { CandidateProfile, Role } from "../../types/candidate/profile";
import type { GithubProfile, GithubRepo } from "../../types/github/github";
import type {
    JobDescription,
    MatchResult,
} from "../../types/job/job-description";
import type { LinkedInProfile } from "../../types/linkedin/linkedin-profile";
import type { AnalysisTarget } from "../../types/analysis-target";

const README_EXCERPT_LENGTH = 600;

// ---------------------------------------------------------------------------
// Shared formatters
// ---------------------------------------------------------------------------

function formatRole(role: Role): string {
    const title = role.title ?? "Unknown title";
    const company = role.company ?? "Unknown company";
    const duration =
        role.startDate && role.endDate
            ? `${role.startDate} – ${role.endDate}`
            : role.startDate
              ? `${role.startDate} – present`
              : null;
    const years = role.yearsInRole != null ? `${role.yearsInRole}y` : null;
    const header = [
        title,
        `@ ${company}`,
        duration,
        years ? `(${years})` : null,
    ]
        .filter(Boolean)
        .join(" ");

    const lines = [`- ${header}`];
    if (role.summary) lines.push(`  ${role.summary}`);
    if (role.technologies.length > 0)
        lines.push(`  Tech: ${role.technologies.join(", ")}`);

    return lines.join("\n");
}

function formatCandidateProfile(profile: CandidateProfile): string {
    const lines: string[] = [];

    lines.push(`Name: ${profile.fullName ?? "N/A"}`);
    if (profile.headline) lines.push(`Headline: ${profile.headline}`);
    if (profile.mostRecentJobTitle)
        lines.push(`Most recent title: ${profile.mostRecentJobTitle}`);
    if (profile.totalYearsOfExperience != null)
        lines.push(`Total experience: ${profile.totalYearsOfExperience} years`);

    lines.push("");
    lines.push(
        "Top skills: " +
            (profile.topSkills.length > 0
                ? profile.topSkills.join(", ")
                : "N/A")
    );

    const { skills } = profile;
    const skillBlocks: string[] = [];
    if (skills.languages.length > 0)
        skillBlocks.push(`Languages: ${skills.languages.join(", ")}`);
    if (skills.frameworks.length > 0)
        skillBlocks.push(`Frameworks: ${skills.frameworks.join(", ")}`);
    if (skills.databases.length > 0)
        skillBlocks.push(`Databases: ${skills.databases.join(", ")}`);
    if (skills.cloudAndInfra.length > 0)
        skillBlocks.push(`Cloud & Infra: ${skills.cloudAndInfra.join(", ")}`);
    if (skills.tools.length > 0)
        skillBlocks.push(`Tools: ${skills.tools.join(", ")}`);
    if (skills.other.length > 0)
        skillBlocks.push(`Other: ${skills.other.join(", ")}`);
    if (skillBlocks.length > 0) lines.push(...skillBlocks);

    if (profile.roles.length > 0) {
        lines.push("");
        lines.push("Experience (most recent first):");
        lines.push(...profile.roles.map(formatRole));
    }

    if (profile.education.length > 0) {
        lines.push("");
        lines.push("Education:");
        for (const edu of profile.education) {
            const degree = [edu.degree, edu.field].filter(Boolean).join(" in ");
            const years = [edu.startYear, edu.endYear]
                .filter(Boolean)
                .join("–");
            lines.push(
                `- ${degree || "Degree N/A"} @ ${edu.institution ?? "N/A"}${years ? ` (${years})` : ""}`
            );
        }
    }

    if (profile.summary) {
        lines.push("");
        lines.push(`Professional summary: ${profile.summary}`);
    }

    return lines.join("\n");
}

function formatRepo(repo: GithubRepo): string {
    const lines: string[] = [];
    const lang = repo.primaryLanguage ? ` [${repo.primaryLanguage}]` : "";
    lines.push(
        `- ${repo.name}${lang}: ${repo.description ?? "No description"}`
    );
    if (repo.readme) {
        const excerpt = repo.readme.slice(0, README_EXCERPT_LENGTH).trim();
        const truncated = repo.readme.length > README_EXCERPT_LENGTH ? "…" : "";
        lines.push(`  README: ${excerpt}${truncated}`);
    }
    return lines.join("\n");
}

function formatGithubProfile(portfolio: GithubProfile): string {
    const lines: string[] = [];

    lines.push(`Username: ${portfolio.username}`);
    if (portfolio.name) lines.push(`Name: ${portfolio.name}`);
    if (portfolio.bio) lines.push(`Bio: ${portfolio.bio}`);
    if (portfolio.location) lines.push(`Location: ${portfolio.location}`);
    if (portfolio.company) lines.push(`Company: ${portfolio.company}`);
    lines.push(`Followers: ${portfolio.followers}`);

    if (portfolio.pinnedRepos.length > 0) {
        lines.push("");
        lines.push("Pinned repositories:");
        lines.push(...portfolio.pinnedRepos.map(formatRepo));
    } else {
        lines.push("");
        lines.push("No pinned repositories.");
    }

    return lines.join("\n");
}

export function formatLinkedInProfile(profile: LinkedInProfile): string {
    const lines: string[] = [];

    if (profile.connections != null)
        lines.push(`Connections: ${profile.connections}+`);

    if (profile.endorsedSkills.length > 0) {
        lines.push("");
        lines.push("Endorsed skills (with peer endorsement counts):");
        for (const skill of profile.endorsedSkills) {
            const count =
                skill.endorsements != null
                    ? ` — ${skill.endorsements} endorsements`
                    : "";
            lines.push(`  ${skill.name}${count}`);
        }
    }

    if (profile.recommendations.length > 0) {
        lines.push("");
        lines.push("Recommendations received:");
        for (const rec of profile.recommendations) {
            const from = rec.recommenderTitle
                ? `${rec.recommenderName} (${rec.recommenderTitle})`
                : rec.recommenderName;
            lines.push(`  From ${from}: "${rec.text}"`);
        }
    }

    if (profile.courses.length > 0) {
        lines.push("");
        lines.push("Courses:");
        for (const course of profile.courses) {
            const assoc = course.associatedWith
                ? ` — ${course.associatedWith}`
                : "";
            lines.push(`  ${course.name}${assoc}`);
        }
    }

    if (profile.volunteerExperience.length > 0) {
        lines.push("");
        lines.push("Volunteer experience:");
        for (const v of profile.volunteerExperience) {
            lines.push(`  ${v.title ?? "N/A"} @ ${v.organization ?? "N/A"}`);
        }
    }

    return lines.join("\n");
}

function formatJobDescription(job: JobDescription): string {
    const lines: string[] = [];

    lines.push(`Role: ${job.title}${job.company ? ` @ ${job.company}` : ""}`);
    if (job.seniorityLevel) lines.push(`Seniority: ${job.seniorityLevel}`);
    if (job.minYearsExperience != null)
        lines.push(`Experience required: ${job.minYearsExperience}+ years`);
    if (job.domain) lines.push(`Domain: ${job.domain}`);

    if (job.requiredSkills.length > 0)
        lines.push(`Required skills: ${job.requiredSkills.join(", ")}`);
    if (job.preferredSkills.length > 0)
        lines.push(`Preferred skills: ${job.preferredSkills.join(", ")}`);

    if (job.responsibilities.length > 0) {
        lines.push("Key responsibilities:");
        job.responsibilities.forEach((r) => lines.push(`  - ${r}`));
    }

    return lines.join("\n");
}

function formatMatchScorecard(match: MatchResult, job: JobDescription): string {
    const bar = (pct: number) => {
        const filled = Math.round(pct / 10);
        return "█".repeat(filled) + "░".repeat(10 - filled) + ` ${pct}%`;
    };

    const lines: string[] = [];
    lines.push(`Overall match:    ${bar(match.overallScore)}`);
    lines.push(`Required skills:  ${bar(match.requiredSkillsScore)}  (${match.matchedRequired.length}/${job.requiredSkills.length} matched)`);
    lines.push(`Experience:       ${bar(match.experienceScore)}`);
    lines.push(`Tech depth:       ${bar(match.techDepthScore)}`);
    if (job.preferredSkills.length > 0)
        lines.push(`Preferred skills: ${bar(match.preferredSkillsScore)}  (${match.matchedPreferred.length}/${job.preferredSkills.length} matched)`);

    if (match.missingRequired.length > 0)
        lines.push(`\nMissing required: ${match.missingRequired.join(", ")}`);

    const strengths = match.matchedRequired
        .filter((m) => m.depth >= 2)
        .map((m) => m.skill);
    if (strengths.length > 0)
        lines.push(`Strongest matches: ${strengths.join(", ")}`);

    return lines.join("\n");
}

// ---------------------------------------------------------------------------
// Shared data blocks (candidate + github + optional linkedin)
// ---------------------------------------------------------------------------

function buildDataSections(
    profile: CandidateProfile,
    portfolio: GithubProfile,
    linkedinProfile: LinkedInProfile | null
): string {
    const linkedInSection = linkedinProfile
        ? `\n=== LINKEDIN PROFILE ===\n${formatLinkedInProfile(linkedinProfile)}\n`
        : "";

    return `=== CANDIDATE PROFILE ===
${formatCandidateProfile(profile)}

=== GITHUB PORTFOLIO ===
${formatGithubProfile(portfolio)}
${linkedInSection}`;
}

// ---------------------------------------------------------------------------
// Goal-mode prompt
// ---------------------------------------------------------------------------

function buildGoalPrompt(
    profile: CandidateProfile,
    portfolio: GithubProfile,
    goal: string,
    linkedinProfile: LinkedInProfile | null
): string {
    const hasLinkedIn = linkedinProfile !== null;

    let sourceIndex = 1;
    const sources = [
        `${sourceIndex++}. A structured candidate profile extracted from their resume`,
        `${sourceIndex++}. Their public GitHub portfolio (pinned repositories)`,
        hasLinkedIn
            ? `${sourceIndex++}. Their LinkedIn profile (peer endorsements, recommendations, courses)`
            : null,
        `${sourceIndex++}. Their stated career goal`,
    ]
        .filter(Boolean)
        .join("\n");

    const linkedInInstructions = hasLinkedIn
        ? `\nWhen LinkedIn data is present, use endorsement counts to corroborate or question skill \
claims from the resume. If a skill appears in the resume's topSkills but has zero or very few \
LinkedIn endorsements, flag the discrepancy. If recommendations are present, treat them as \
qualitative evidence of real-world impact.\n`
        : "";

    return `You are AscentX Career Architect — an expert career coach and senior engineering mentor. \
Your role is to give developers a candid, constructive career assessment to help them reach their \
stated goal.

You have access to the following data sources:
${sources}

Your analysis must be evidence-based: cite specific skills, roles, technologies, or repositories \
when making claims. Do not invent information. If something is absent from all sources, call it out \
as a gap.

When assessing the GitHub portfolio, also evaluate the quality of READMEs and documentation. \
A repo with a clear README (architecture decisions, setup instructions, motivation) signals \
engineering maturity. Empty or auto-generated READMEs are a meaningful gap for senior+ roles.
${linkedInInstructions}
${buildDataSections(profile, portfolio, linkedinProfile)}
=== CAREER GOAL ===
${goal}

=== INSTRUCTIONS ===
Produce exactly four sections, using these headings verbatim:

## Current Standing
Assess the candidate's current profile honestly. Highlight the strongest signals (skills, roles, \
projects) that are relevant to the goal. Note any inconsistencies between the resume and the \
GitHub portfolio (e.g. skills claimed but no evidence in repos, GitHub activity unmentioned in the \
CV, or repos with weak/missing documentation). Keep this to 2–3 short paragraphs.

## Technical Blind Spots
List 2–4 specific technical gaps between the candidate's current footprint and the stated goal. \
Each item must be a concrete skill, pattern, or area — not a vague category. Format as a numbered \
list with a one-sentence explanation for each gap.

## Quick Wins
List 2–3 concrete improvements the candidate can make this week — no new projects required. \
These should be profile or visibility fixes: rewriting a GitHub README, rephrasing a job title, \
pinning a more relevant repo, adding missing keywords to the resume, etc. Format as a numbered \
list. Each item must be actionable in under an hour.

## The Level-Up Roadmap
Propose one concrete "Hero Project" the candidate should build to address the blind spots and \
demonstrate readiness for the goal. Structure it as:
- What to build (one sentence)
- Which blind spots it addresses (reference the numbered list above)
- The core tech stack to use
- 30-day milestone: the smallest working version worth sharing
- 90-day milestone: what "done enough to put on a resume" looks like

Keep the entire response under 1200 words.`;
}

// ---------------------------------------------------------------------------
// Job-mode prompt
// ---------------------------------------------------------------------------

function buildJobPrompt(
    profile: CandidateProfile,
    portfolio: GithubProfile,
    jobDescription: JobDescription,
    matchResult: MatchResult,
    linkedinProfile: LinkedInProfile | null
): string {
    const hasLinkedIn = linkedinProfile !== null;

    let sourceIndex = 1;
    const sources = [
        `${sourceIndex++}. A structured candidate profile extracted from their resume`,
        `${sourceIndex++}. Their public GitHub portfolio (pinned repositories)`,
        hasLinkedIn
            ? `${sourceIndex++}. Their LinkedIn profile (peer endorsements, recommendations, courses)`
            : null,
        `${sourceIndex++}. A target job description with an algorithmic match scorecard`,
    ]
        .filter(Boolean)
        .join("\n");

    const linkedInInstructions = hasLinkedIn
        ? `\nWhen LinkedIn data is present, use endorsement counts to corroborate or question skill \
claims from the resume. If a skill appears in the resume's topSkills but has zero or very few \
LinkedIn endorsements, flag the discrepancy. If recommendations are present, treat them as \
qualitative evidence of real-world impact.\n`
        : "";

    return `You are AscentX Career Architect — an expert career coach and senior engineering mentor. \
Your role is to give developers a candid, constructive assessment of their fit for a specific job \
and a concrete plan to close the gaps.

You have access to the following data sources:
${sources}

Your analysis must be evidence-based: cite specific skills, roles, technologies, or repositories \
when making claims. Do not invent information. If something is absent from all sources, call it out \
as a gap.

When assessing the GitHub portfolio, also evaluate the quality of READMEs and documentation. \
A repo with a clear README (architecture decisions, setup instructions, motivation) signals \
engineering maturity. Empty or auto-generated READMEs are a meaningful gap for senior+ roles.
${linkedInInstructions}
A match scorecard has been computed algorithmically and is provided below. Treat the scores as \
ground truth — do not re-derive or contradict them. Use them to anchor your analysis: explain what \
the scores mean for this candidate's chances, and focus the blind spots and roadmap on the missing \
required skills.

${buildDataSections(profile, portfolio, linkedinProfile)}
=== JOB DESCRIPTION ===
${formatJobDescription(jobDescription)}

=== MATCH SCORECARD ===
${formatMatchScorecard(matchResult, jobDescription)}

=== INSTRUCTIONS ===
Produce exactly five sections, using these headings verbatim:

## Match Summary
In 2–3 sentences, interpret the overall match score for this candidate. State whether they are a \
strong, moderate, or weak match for this specific role, and identify the single most important gap \
to close. Do not reprint the raw scorecard — the candidate can see it above.

## Current Standing
Assess the candidate's profile against this specific role. Highlight the strongest signals (skills, \
roles, projects) that are directly relevant to the job requirements. Note any inconsistencies \
between the resume and the GitHub portfolio (e.g. required skills claimed but no evidence in repos, \
or repos with weak/missing documentation). Keep this to 2–3 short paragraphs.

## Technical Blind Spots
List the 2–4 most critical gaps between the candidate's current footprint and the job's \
requirements. Prioritise missing required skills over preferred ones. Each item must be a concrete \
skill, pattern, or area — not a vague category. Format as a numbered list with a one-sentence \
explanation per gap.

## Quick Wins
List 2–3 concrete improvements the candidate can make this week to strengthen their application — \
no new projects required. Examples: add a missing keyword to the resume, write a README for a \
relevant project, reframe a job title to better match the target role's language. Format as a \
numbered list. Each item must be actionable in under an hour.

## The Level-Up Roadmap
Propose one concrete "Hero Project" that directly addresses the missing required skills for this \
role. Structure it as:
- What to build (one sentence, directly tied to the job's domain or tech stack)
- Which blind spots it addresses (reference the numbered list above)
- The core tech stack to use (align with the job's required/preferred skills)
- 30-day milestone: the smallest working version worth sharing
- 90-day milestone: what "done enough to put on a resume before applying" looks like

Keep the entire response under 1200 words.`;
}

// ---------------------------------------------------------------------------
// Public entry point
// ---------------------------------------------------------------------------

export function buildPrompt(
    profile: CandidateProfile,
    portfolio: GithubProfile,
    target: AnalysisTarget,
    linkedinProfile: LinkedInProfile | null = null,
    jobDescription: JobDescription | null = null,
    matchResult: MatchResult | null = null
): string {
    if (target.mode === "job" && jobDescription && matchResult) {
        return buildJobPrompt(
            profile,
            portfolio,
            jobDescription,
            matchResult,
            linkedinProfile
        );
    }

    return buildGoalPrompt(
        profile,
        portfolio,
        target.mode === "goal" ? target.goal : "",
        linkedinProfile
    );
}
