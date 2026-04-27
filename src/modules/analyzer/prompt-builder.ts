import type { CandidateProfile, Role } from "../../types/candidate/profile";
import type { GithubProfile, GithubRepo } from "../../types/github/github";
import type { LinkedInProfile } from "../../types/linkedin/linkedin-profile";

const README_EXCERPT_LENGTH = 600;

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

export function buildPrompt(
    profile: CandidateProfile,
    portfolio: GithubProfile,
    goal: string,
    linkedinProfile: LinkedInProfile | null = null
): string {
    const hasLinkedIn = linkedinProfile !== null;

    const dataSourcesList = [
        "1. A structured candidate profile extracted from their resume",
        "2. Their public GitHub portfolio (pinned repositories)",
        hasLinkedIn
            ? "3. Their LinkedIn profile (peer endorsements, recommendations, courses)"
            : null,
        `${hasLinkedIn ? "4" : "3"}. Their stated career goal`,
    ]
        .filter(Boolean)
        .join("\n");

    const linkedInInstructions = hasLinkedIn
        ? `\nWhen LinkedIn data is present, use endorsement counts to corroborate or question skill claims \
from the resume. If a skill appears in the resume's topSkills but has zero or very few LinkedIn \
endorsements, flag the discrepancy. If recommendations are present, treat them as qualitative \
evidence of real-world impact.\n`
        : "";

    const linkedInSection = hasLinkedIn
        ? `\n=== LINKEDIN PROFILE ===\n${formatLinkedInProfile(linkedinProfile!)}\n`
        : "";

    return `You are AscentX Career Architect — an expert career coach and senior engineering mentor. \
Your role is to give developers a brutally honest, highly actionable career audit based on their \
resume, GitHub portfolio, and stated career goal.

You have access to the following data sources:
${dataSourcesList}

Your analysis must be evidence-based: cite specific skills, roles, technologies, or repositories \
when making claims. Do not invent information. If something is absent from all sources, call it out \
as a gap.
${linkedInInstructions}
=== CANDIDATE PROFILE ===
${formatCandidateProfile(profile)}

=== GITHUB PORTFOLIO ===
${formatGithubProfile(portfolio)}
${linkedInSection}
=== CAREER GOAL ===
${goal}

=== INSTRUCTIONS ===
Produce exactly three sections, using these headings verbatim:

## Current Standing
Assess the candidate's current profile honestly. Highlight the strongest signals (skills, roles, \
projects) that are relevant to the goal. Note any inconsistencies between the resume and the \
GitHub portfolio (e.g. skills claimed but no evidence in repos, or GitHub activity that goes \
unmentioned in the CV). Keep this to 2–3 short paragraphs.

## Technical Blind Spots
List exactly 3 specific technical gaps between the candidate's current footprint and the stated \
goal. Each item must be a concrete skill, pattern, or area — not a vague category. Format as a \
numbered list with a one-sentence explanation for each gap.

## The Level-Up Roadmap
Propose one concrete "Hero Project" the candidate should build to address the blind spots and \
demonstrate readiness for the goal. Specify:
- What to build (one sentence)
- Which blind spots it addresses (reference the numbered list above)
- The core tech stack to use
- One measurable milestone that signals the project is "done enough" to put on a resume

Keep the entire response under 600 words.`;
}
