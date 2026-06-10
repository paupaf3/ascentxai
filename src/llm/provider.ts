import { createOpenAI } from "@ai-sdk/openai";
import type { LanguageModelV1 } from "@ai-sdk/provider";

type ModelOptions = Record<string, unknown>;

let nim: ReturnType<typeof createOpenAI>;

function getNim() {
    if (!nim) {
        nim = createOpenAI({
            baseURL: "https://integrate.api.nvidia.com/v1",
            ...(process.env.NIM_API_KEY
                ? { apiKey: process.env.NIM_API_KEY }
                : {}),
            name: "nim",
            compatibility: "compatible",
        });
    }
    return nim;
}

export function getModel(
    modelName: string,
    options?: ModelOptions
): LanguageModelV1 {
    return getNim()(modelName, options);
}
