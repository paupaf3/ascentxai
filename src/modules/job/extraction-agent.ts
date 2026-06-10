import { Agent } from "@mastra/core/agent";

import { getModel } from "../../llm/provider";

const DEFAULT_EXTRACTION_MODEL = "meta/llama-3.1-8b-instruct";
const extractionModel =
    process.env.EXTRACTION_MODEL?.trim() || DEFAULT_EXTRACTION_MODEL;

export const jobExtractionAgent = new Agent({
    name: "job-extraction-agent",
    instructions: [
        "You are an expert technical recruiter extracting structured data from job postings.",
        "",
        "GENERAL RULES",
        "- If information is missing or ambiguous, return null for that field. Never invent data.",
        "- Normalize all technology/skill names to their canonical form: 'TypeScript' (not 'TS'), 'Kubernetes' (not 'k8s'), 'PostgreSQL' (not 'Postgres'), 'Node.js' (not 'node'). These are compared directly against resume and GitHub data.",
        "- Deduplicate: each skill should appear at most once across requiredSkills and preferredSkills combined.",
        "",
        "SKILLS CLASSIFICATION",
        "- requiredSkills: only skills explicitly marked as required, must-have, or mandatory — or that appear in the core responsibilities without qualification.",
        "- preferredSkills: skills marked as preferred, nice-to-have, bonus, or 'experience with X is a plus'. Do not repeat anything already in requiredSkills.",
        "- Ignore soft skills (communication, teamwork, etc.) — only extract concrete technical skills, languages, frameworks, tools, and platforms.",
        "",
        "SENIORITY LEVEL",
        "- Infer from the job title and requirements. A 'Senior Engineer' requiring 5+ years is 'senior'. 'Staff' or 'Principal' in the title maps directly. A role requiring 0–2 years is 'junior', 2–4 is 'mid'.",
        "",
        "RESPONSIBILITIES",
        "- Extract at most 5 responsibilities. Keep each to one concise sentence. Focus on technical substance, not culture or values.",
        "",
        "DOMAIN",
        "- Infer the business domain from company context, product description, or the nature of the work (e.g. 'payments', 'developer tooling', 'ML infrastructure'). Return null if unclear.",
    ].join("\n"),
    model: getModel(extractionModel, { temperature: 0 }),
});
