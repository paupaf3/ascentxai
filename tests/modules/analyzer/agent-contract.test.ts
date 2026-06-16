import { describe, it, expect } from "vitest";

describe("candidateExtractionAgent instructions contract", () => {
    it("uses the correct agent name", async () => {
        const { candidateExtractionAgent } =
            await import("../../../src/modules/candidate/extraction-agent");
        expect(candidateExtractionAgent.name).toBe(
            "candidate-extraction-agent"
        );
    });

    it("requires canonical skill names", async () => {
        const { candidateExtractionAgent } =
            await import("../../../src/modules/candidate/extraction-agent");
        const instructions = candidateExtractionAgent.instructions;
        expect(instructions).toContain("canonical form");
        expect(instructions).toContain("PostgreSQL");
        expect(instructions).toContain("Node.js");
    });

    it("includes non-overlapping total XP calculation instruction", async () => {
        const { candidateExtractionAgent } =
            await import("../../../src/modules/candidate/extraction-agent");
        const instructions = candidateExtractionAgent.instructions;
        expect(instructions).toContain("NON-OVERLAPPING");
    });

    it("includes topSkills constraint of at most five", async () => {
        const { candidateExtractionAgent } =
            await import("../../../src/modules/candidate/extraction-agent");
        const instructions = candidateExtractionAgent.instructions;
        expect(instructions).toContain("at most five");
    });

    it("includes the links extraction instruction", async () => {
        const { candidateExtractionAgent } =
            await import("../../../src/modules/candidate/extraction-agent");
        const instructions = candidateExtractionAgent.instructions;
        expect(instructions).toContain("Scan the full document");
        expect(instructions).toContain("GitHub");
    });
});

describe("linkedinExtractionAgent instructions contract", () => {
    it("uses the correct agent name", async () => {
        const { linkedinExtractionAgent } =
            await import("../../../src/modules/linkedin/extraction-agent");
        expect(linkedinExtractionAgent.name).toBe("linkedin-extraction-agent");
    });

    it("instructs to extract endorsement counts separately", async () => {
        const { linkedinExtractionAgent } =
            await import("../../../src/modules/linkedin/extraction-agent");
        const instructions = linkedinExtractionAgent.instructions;
        expect(instructions).toContain("endorsedSkills");
    });

    it("instructs to copy recommendations verbatim", async () => {
        const { linkedinExtractionAgent } =
            await import("../../../src/modules/linkedin/extraction-agent");
        const instructions = linkedinExtractionAgent.instructions;
        expect(instructions).toContain("Copy recommendation text verbatim");
    });

    it("instructs to normalize connection count", async () => {
        const { linkedinExtractionAgent } =
            await import("../../../src/modules/linkedin/extraction-agent");
        const instructions = linkedinExtractionAgent.instructions;
        expect(instructions).toContain("500+");
        expect(instructions).toContain("numeric floor");
    });
});

describe("jobExtractionAgent instructions contract", () => {
    it("uses the correct agent name", async () => {
        const { jobExtractionAgent } =
            await import("../../../src/modules/job/extraction-agent");
        expect(jobExtractionAgent.name).toBe("job-extraction-agent");
    });

    it("distinguishes required vs preferred skills", async () => {
        const { jobExtractionAgent } =
            await import("../../../src/modules/job/extraction-agent");
        const instructions = jobExtractionAgent.instructions;
        expect(instructions).toContain("requiredSkills");
        expect(instructions).toContain("preferredSkills");
    });

    it("instructs to ignore soft skills", async () => {
        const { jobExtractionAgent } =
            await import("../../../src/modules/job/extraction-agent");
        const instructions = jobExtractionAgent.instructions;
        expect(instructions).toContain("Ignore soft skills");
    });

    it("limits responsibilities to 5", async () => {
        const { jobExtractionAgent } =
            await import("../../../src/modules/job/extraction-agent");
        const instructions = jobExtractionAgent.instructions;
        expect(instructions).toContain("at most 5 responsibilities");
    });
});

describe("careerAnalysisAgent instructions contract", () => {
    it("uses the correct agent name", async () => {
        const { careerAnalysisAgent } =
            await import("../../../src/modules/analyzer/analysis-agent");
        expect(careerAnalysisAgent.name).toBe("career-analysis-agent");
    });

    it("instructs to use tools only when context is insufficient", async () => {
        const { careerAnalysisAgent } =
            await import("../../../src/modules/analyzer/analysis-agent");
        const instructions = careerAnalysisAgent.instructions;
        expect(instructions).toContain(
            "only when the provided context is clearly insufficient"
        );
        expect(instructions).toContain("Do not call tools speculatively");
    });

    it("registers both GitHub tools", async () => {
        const { careerAnalysisAgent } =
            await import("../../../src/modules/analyzer/analysis-agent");
        expect(Object.keys(careerAnalysisAgent.tools ?? {})).toEqual([
            "fetch_github_repo",
            "fetch_top_github_repos",
        ]);
    });

    it("contains the correct tool descriptions in instructions", async () => {
        const { careerAnalysisAgent } =
            await import("../../../src/modules/analyzer/analysis-agent");
        const instructions = careerAnalysisAgent.instructions;
        expect(instructions).toContain("fetch_github_repo");
        expect(instructions).toContain("fetch_top_github_repos");
        expect(instructions).toContain("owner/repo");
    });
});
