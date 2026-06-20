import type { RunLogger } from "../../logger";
import { mastra } from "../../mastra";
import {
    jobDescriptionSchema,
    type JobDescription,
} from "../../types/job/job-description";

function isUrl(input: string): boolean {
    return /^https?:\/\//i.test(input.trim());
}

function stripHtml(html: string): string {
    return html
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\s{2,}/g, " ")
        .trim();
}

async function fetchJobText(url: string): Promise<string> {
    const response = await fetch(url, {
        headers: {
            "User-Agent":
                "Mozilla/5.0 (compatible; AscentX/1.0; +https://github.com/paupaf3/ascentxai)",
        },
    });

    if (!response.ok) {
        throw new Error(
            `Failed to fetch job posting at ${url}: HTTP ${response.status}`
        );
    }

    const contentType = response.headers.get("content-type") ?? "";
    const raw = await response.text();

    return contentType.includes("html") ? stripHtml(raw) : raw;
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
