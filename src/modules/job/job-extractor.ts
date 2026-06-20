import type { RunLogger } from "../../logger";
import { mastra } from "../../mastra";
import {
    jobDescriptionSchema,
    type JobDescription,
} from "../../types/job/job-description";

function isUrl(input: string): boolean {
    return /^https?:\/\//i.test(input.trim());
}

async function fetchJobText(url: string): Promise<string> {
    const jinaUrl = `https://r.jina.ai/${encodeURI(url)}`;

    const response = await fetch(jinaUrl, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (compatible; AscentX/1.0; +https://github.com/paupaf3/ascentxai)",
        },
        signal: AbortSignal.timeout(30_000),
    });

    if (!response.ok) {
        throw new Error(
            `Failed to fetch job posting at ${url}: Jina returned HTTP ${response.status}`
        );
    }

    return response.text();
}

export async function extractJobDescription(
    input: string,
    logger?: RunLogger
): Promise<JobDescription> {
    if (!process.env.NIM_API_KEY) {
        throw new Error(
            "NIM_API_KEY is not set. Add it to your .env file before running extraction."
        );
    }

    logger?.logData("jobInput", isUrl(input) ? input : "<inline text>");

    const text = isUrl(input) ? await fetchJobText(input) : input;
    logger?.logData("jobFetchedText", {
        via: "jina",
        length: text.length,
        preview: `${text.slice(0, 1000)}${text.length > 1000 ? "..." : ""}`,
    });

    const agent = mastra.getAgent("jobExtractionAgent");

    const userMessage = [
        "Extract the job description data from the posting text below.",
        "Return strict JSON that matches the provided schema.",
        "---BEGIN JOB POSTING---",
        text,
        "---END JOB POSTING---",
    ].join("\n");

    logger?.logData("jobExtractionPrompt", {
        role: "user",
        content: `${userMessage.slice(0, 2000)}${userMessage.length > 2000 ? "..." : ""}`,
    });

    const result = await agent.generate(
        [{ role: "user", content: userMessage }],
        { output: jobDescriptionSchema }
    );

    logger?.logData("jobExtractionRawResponse", result.object);

    return jobDescriptionSchema.parse(result.object);
}
