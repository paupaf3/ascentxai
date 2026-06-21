# AscentX.ai

**Career-progression intelligence.** Analyze the "delta" between your current professional footprint (resume, GitHub, LinkedIn) and a target role or job description, then get a structured AI-generated roadmap for leveling up.

---

## Table of Contents

- [Learning Path](#learning-path) — start here if you're new to the project
- [What It Does](#what-it-does)
- [Quick Start](#quick-start)
- [Tech Stack & Why](#tech-stack--why)
- [Architecture Overview](#architecture-overview)
- [Module Deep Dive](#module-deep-dive)
- [Scripts](#scripts)
- [Running Tests](#running-tests)
- [Roadmap](#roadmap)

---

## Learning Path

New to the project? Here's how to ramp up, file by file, in dependency order:

### Step 1 — Understand the Types

The project is built on **runtime-validated types** using Zod. Every data shape is defined as a Zod schema, then TypeScript types are inferred from it. This means: change the schema → types update automatically; parse any untrusted data with `schema.parse()` → get validated output.

Start here:

| File                                                | What to learn                                                                                                                                                                                                                                                                   |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/types/analysis-target.ts`                      | **3 lines.** A discriminated union: `{ mode: "goal", goal: string }` or `{ mode: "job", jobInput: string }`. The simplest type in the project — a good warm-up.                                                                                                                 |
| `src/types/candidate/profile.ts`                    | **151 lines.** The largest schema. See how Zod models nested data: roles with per-role tech stacks, skill taxonomy (languages / frameworks / databases / cloud / tools / other), education, certifications. Note the `topSkills` cap at 5, and how nullable fields are handled. |
| `src/types/job/job-description.ts`                  | **51 lines.** A newer schema — see how `JobDescription` differs from `CandidateProfile` (required vs preferred skills, seniority level, responsibilities). Also defines `MatchResult` and `SkillMatch` interfaces.                                                              |
| `src/types/github/github.ts` + `github-response.ts` | Clean domain types + raw GraphQL response schemas. The separation between "what GitHub returns" and "what we use" is a deliberate pattern.                                                                                                                                      |
| `src/types/linkedin/linkedin-profile.ts`            | **96 lines.** Reuses skill/role/education schemas from `candidate/profile.ts`. See how Zod composition works.                                                                                                                                                                   |

### Step 2 — Extraction Modules (the leaves)

Each data source has its own module. They all follow the same pattern:

```
Input (PDF / URL / text)
  → raw extraction (unpdf / HTTP fetch)
   → Mastra agent (NVIDIA NIM, temperature 0)
  → Zod validation
  → typed domain object
```

| Module        | Files                                                                            | What to learn                                                                                                                                                                                                                       |
| ------------- | -------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Candidate** | `modules/candidate/pdf-parser.ts`, `extraction-agent.ts`, `profile-extractor.ts` | The canonical extraction pipeline. `pdf-parser.ts` shows how to use `unpdf`; `extraction-agent.ts` shows how to define a Mastra agent with Zod output; `profile-extractor.ts` shows how to chain them with error handling.          |
| **LinkedIn**  | `modules/linkedin/extraction-agent.ts`, `profile-extractor.ts`                   | Mirrors the candidate pipeline exactly. Reuses `pdf-parser.ts` from candidate (no code duplication). See how the agent instructions differ for LinkedIn-specific data (endorsed skills with peer counts, verbatim recommendations). |
| **GitHub**    | `modules/github/github-queries.ts`, `github-client.ts`, `github-mapper.ts`       | No AI here — pure GraphQL. `github-queries.ts` has the GraphQL strings; `github-client.ts` is the API client with auth & error handling; `github-mapper.ts` maps raw responses to clean types.                                      |
| **Job**       | `modules/job/extraction-agent.ts`, `job-extractor.ts`, `matcher.ts`              | The newest module. `job-extractor.ts` handles both URL (HTTP fetch + HTML stripping) and inline text input. `matcher.ts` contains the algorithmic scoring engine.                                                                   |

### Step 3 — The Analyzer (the orchestrator)

| File                                  | What to learn                                                                                                                                                                                                                                                  |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `modules/analyzer/prompt-builder.ts`  | **468 lines, the largest file.** Pure string-building. Two modes (goal + job), handles 3 or 4 data sources, README excerpting, LinkedIn cross-check instructions, 1200-word limit. The output section headings are verbatim contract between prompt and agent. |
| `modules/analyzer/career-analyzer.ts` | The main orchestrator. Runs 4 extraction pipelines in parallel via `Promise.all`, then builds the prompt, calls the analysis agent, and returns the result. Learn how staged logging is wired.                                                                 |
| `modules/analyzer/tools.ts`           | Two Mastra tools the analysis agent can call mid-reasoning to fetch more GitHub data. Shows how tools are defined with Zod I/O schemas.                                                                                                                        |

### Step 4 — Supporting Infrastructure

| File        | What to learn                                                                                                                        |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `logger.ts` | `RunLogger` class. Creates one JSON log file per run with staged timing. Synchronous writes (`writeFileSync`) — simple but blocking. |
| `mastra.ts` | Central agent registry. All 4 agents registered on one `Mastra` instance for observability.                                          |

### Step 5 — Scripts & Entry Points

| File                          | What to learn                                                                                                                                                       |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/analyze.ts`          | The de facto CLI. Raw `process.argv` parsing with `--job` flag detection and LinkedIn PDF auto-detection. Not the final CLI — that's planned in `src/cli/index.ts`. |
| `scripts/extract-resume.ts`   | Minimal test harness for the candidate extraction pipeline.                                                                                                         |
| `scripts/extract-linkedin.ts` | Mirror of above for LinkedIn.                                                                                                                                       |
| `scripts/github-test.ts`      | Subcommand-based test harness for the GitHub module.                                                                                                                |

---

## What It Does

Given a **PDF resume**, a **GitHub username**, an optional **LinkedIn PDF export**, and either a **career goal** or a **job posting**, AscentX:

1. Extracts a structured candidate profile from the resume (skills, roles, technologies)
2. Fetches the candidate's GitHub portfolio (pinned repos, languages, READMEs)
3. Optionally extracts the LinkedIn profile (endorsed skills with counts, recommendations, courses)
4. If in **job mode**: fetches/parses the job description and computes an algorithmic match scorecard
5. Cross-references all sources against the target
6. Produces a structured analysis with:
    - **Match Summary** (job mode only) — overall fit score interpretation
    - **Current Standing** — evidence-based assessment
    - **Technical Blind Spots** — specific gaps to close
    - **Quick Wins** (job mode only) — immediate improvements
    - **The Level-Up Roadmap** — a concrete "Hero Project"

---

## Quick Start

```bash
git clone <repo>
cd ascentxai
npm install
cp .env.sample .env
# Fill in NIM_API_KEY and GITHUB_TOKEN
```

### Goal mode (existing profile → target role):

```bash
npm run analyze -- ./resume.pdf <github-username> "Staff Engineer at a B2B SaaS company"

# With LinkedIn PDF:
npm run analyze -- ./resume.pdf <github-username> ./linkedin.pdf "Staff Engineer at a B2B SaaS company"
```

### Job mode (existing profile → specific job posting):

```bash
npm run analyze -- ./resume.pdf <github-username> --job "https://company.com/jobs/senior-engineer"

# Or with inline job description text:
npm run analyze -- ./resume.pdf <github-username> --job "Staff Engineer at a B2B SaaS company"
```

### Individual extraction scripts:

```bash
npm run resume:extract -- ./resume.pdf
npm run linkedin:extract -- ./linkedin.pdf
npm run github:test profile <username>
npm run github:test repo <owner/repo>
```

---

## Tech Stack & Why

| Library                                                                           | Role                 | Why this one?                                                                                                                                          |
| --------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [**Mastra**](https://mastra.dev) (`@mastra/core`)                                 | AI agent framework   | Lighter than LangChain. Handles agent lifecycle, tool binding, structured output, and observability out of the box.                                    |
| [**Vercel AI SDK**](https://sdk.vercel.ai) (`@ai-sdk/openai`)                     | Model binding        | Provider-agnostic abstraction. Points at NVIDIA NIM (OpenAI-compatible endpoint). Model configurable via `EXTRACTION_MODEL` / `ANALYSIS_MODEL` env vars.          |
| [**Zod**](https://zod.dev)                                                        | Runtime validation   | Every external boundary (GitHub API, AI agent output, tool I/O) is validated at runtime. Prevents `undefined` propagation and catches API drift early. |
| [**Octokit GraphQL**](https://github.com/octokit/graphql.js) (`@octokit/graphql`) | GitHub API client    | Official GitHub SDK. GraphQL lets us fetch profile + pinned repos + READMEs in a single round-trip.                                                    |
| [**unpdf**](https://github.com/ycjcl868/unpdf)                                    | PDF text extraction  | Zero-dependency PDF parser. Chosen over `pdf-parse` (native build issues) and `pdfjs-dist` (heavy).                                                    |
| [**tsx**](https://github.com/privatenumber/tsx)                                   | TypeScript execution | Runs `.ts` files directly — no compile step. Faster than `ts-node`.                                                                                    |
| [**Vitest**](https://vitest.dev)                                                  | Test runner          | Drop-in Jest replacement. Faster, ESM-native, built-in coverage, same `describe`/`it`/`expect` API.                                                    |
| [**dotenv**](https://github.com/motdotla/dotenv)                                  | Environment config   | Loads `.env` at startup. Standard for Node CLI tools.                                                                                                  |

---

## Architecture Overview

```
USER INPUT (resume.pdf, github-username, optional linkedin.pdf, goal/job)
       │
       ▼
scripts/analyze.ts
  ─ parses args (--job flag, positional)
  ─ resolves file paths
  ─ builds AnalysisTarget discriminated union
  ─ calls analyze()
       │
       ▼
modules/analyzer/career-analyzer.ts :: analyze()
  ─ creates RunLogger
  ─ starts 4 stages (resume, github, linkedin?, job?)
  ─ runs extraction in parallel:
       │
       ├──► candidate/profile-extractor
       │      └── pdf-parser (unpdf) → Mastra agent → Zod validation
       │
       ├──► github/github-client
       │      └── GraphQL query → Zod validation → domain mapper
       │
       ├──► linkedin/profile-extractor (optional)
       │      └── pdf-parser (unpdf) → Mastra agent → Zod validation
       │
       └──► job/job-extractor (optional)
              └── HTTP fetch or inline text → Mastra agent → Zod validation
       │
       ▼
  ─ if job mode: computeMatch(profile, portfolio, jobDescription)
       │
       ▼
  ─ buildPrompt(profile, portfolio, target, linkedin, jobDesc, matchResult)
       │
       ▼
  ─ careerAnalysisAgent.generate(prompt)
       │  (can call tools/fetch_github_repo mid-reasoning)
       ▼
  ─ returns analysis string → stdout
```

### Key design decisions:

- **Parallel extraction**: Resume, GitHub, LinkedIn, and job extraction all run concurrently in `Promise.all`. No unnecessary serialization.
- **Runtime validation at every boundary**: Zod schemas validate GitHub API responses, AI agent outputs, and tool I/O. If the API or model changes format, you catch it immediately.
- **Consistent pipeline pattern**: Every extraction follows `parse → agent → validate`. Adding a new data source (e.g. LeetCode, Stack Overflow) means following this template.
- **Staged logging**: Each step logs start/finish with timestamps to a JSON file. Makes debugging AI agent runs reproducible.

---

## Module Deep Dive

### Types (`src/types/`)

Every type in the project follows the same pattern:

```typescript
// 1. Define a Zod schema
export const candidateProfileSchema = z.object({
    name: z.string(),
    topSkills: z.array(z.string()).max(5),
    // ...
});

// 2. Infer the TypeScript type
export type CandidateProfile = z.infer<typeof candidateProfileSchema>;
```

This gives you **runtime validation** (parse AI output with `schema.parse()`) and **compile-time safety** (TypeScript knows the shape).

| Schema file                    | Key validation rules                                                                |
| ------------------------------ | ----------------------------------------------------------------------------------- |
| `candidate/profile.ts`         | `topSkills` max 5, date format YYYY or YYYY-MM or "present", skill buckets required |
| `github/github-response.ts`    | Validates raw GraphQL response shape before mapping                                 |
| `linkedin/linkedin-profile.ts` | Reuses `roleSchema`, `skillsSchema` from candidate                                  |
| `job/job-description.ts`       | `requiredSkills` and `preferredSkills` must be disjoint                             |

### Extraction Modules

All four extraction modules follow the same pattern. The **candidate module** is the canonical example:

**`pdf-parser.ts`** — I/O layer:

- `parsePdfFromPath(filePath)` — reads file, validates `.pdf` extension, extracts text via `unpdf`
- `parsePdfFromBuffer(buffer)` — same but from a buffer (for future HTTP API usage)
- Uses `mergePages: true` to get a single continuous text string

**`extraction-agent.ts`** — Mastra agent definition:

- Temperature 0 for deterministic output
- Model configurable via `EXTRACTION_MODEL` env var
- Instructions tuned for: canonical skill naming ("TypeScript" not "TS"), per-role tech lists, non-overlapping experience calculation, null policy
- Agent returns structured output matching the Zod schema

**`profile-extractor.ts`** — orchestration:

- Validates API key (throws descriptive error if missing)
- Calls `pdf-parser.ts` to get raw text
- Calls agent with the raw text
- Validates agent output with `candidateProfileSchema.parse()`
- Double-validation: agent returns structured output, then Zod re-parses (catches schema drift)

### Analyzer Module

**`prompt-builder.ts`** — the art of prompt engineering:

The prompt has three layers:

1. **System role** — "AscentX Career Architect — an expert career coach and senior engineering mentor"
2. **Data sections** — candidate profile, GitHub portfolio, LinkedIn (optional), job description (optional), match scorecard (optional)
3. **Output instructions** — verbatim section headings, word limit, citation requirements

Key details:

- README excerpts are truncated at 600 characters with `…`
- GitHub repos with no README show "No description"
- LinkedIn endorsements are used for cross-checking (flag if `topSkills` have zero endorsements)
- In job mode, the match scorecard is embedded as "ground truth — do not re-derive or contradict"
- Word limit: 1200 words (enforced by instruction, not programmatically)

The two mode functions (`buildGoalPrompt`, `buildJobPrompt`) are called from a single `buildPrompt` dispatcher that checks `target.mode`.

**`career-analyzer.ts`** — the orchestrator:

```typescript
const [profile, portfolio, linkedinProfile, jobDescription] = await Promise.all([
    extractCandidateProfile({ filePath: resumePath })
        .then(result => { logger.endStage(..., result); return result; })
        .catch(err => { logger.failStage(...); throw err; }),
    fetchProfile(githubUsername).then(...).catch(...),
    linkedinPromise,
    jobPromise,
]);
```

Each extraction is wrapped in `.then()/.catch()` for stage logging. If any extraction fails, the whole run fails — the orchestrator doesn't try to continue with partial data.

**`matcher.ts`** — algorithmic scoring:

```typescript
overallScore =
    requiredSkillsScore * 0.45 +
    experienceScore * 0.25 +
    techDepthScore * 0.2 +
    preferredSkillsScore * 0.1;
```

- **Required skills** (45%): fraction of required skills found in candidate's skill set
- **Experience** (25%): candidate years / required years, capped at 1.0
- **Tech depth** (20%): average depth (0-3) of matched skills, normalized
    - 0: not found in resume or repos
    - 1: in resume only
    - 2: in resume + 1 repo reference
    - 3: in resume + multiple repo references
- **Preferred skills** (10%): fraction of preferred skills matched

### Logger (`src/logger.ts`)

The `RunLogger` creates one JSON file per analysis run:

```json
{
  "runId": "abc123",
  "inputs": { "resumePath": "...", "githubUsername": "...", "target": {...} },
  "stages": [
    { "name": "resume_extraction", "status": "success", "startedAt": "...", "durationMs": 1234, "output": {...} }
  ],
  "failed": false
}
```

Stages are tracked as the orchestrator progresses. The log file path is printed at the start of each run for easy debugging.

---

## Scripts

All scripts are development/testing tools — not part of the production build. See `scripts/README.md` for detailed docs.

| Script                | npm command                | Purpose                                             |
| --------------------- | -------------------------- | --------------------------------------------------- |
| `analyze.ts`          | `npm run analyze`          | Full end-to-end analysis (goal + job modes)         |
| `github-test.ts`      | `npm run github:test`      | Manual GitHub API test (profile + repo subcommands) |
| `extract-resume.ts`   | `npm run resume:extract`   | Test resume extraction pipeline                     |
| `extract-linkedin.ts` | `npm run linkedin:extract` | Test LinkedIn extraction pipeline                   |

---

## Running Tests

```bash
npm test              # Run all tests (vitest)
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

### Test organization

```
tests/
├── modules/
│   ├── candidate/     # pdf-parser (6), profile-extractor (4), profile-schema (6)
│   ├── github/        # github-client (17)
│   ├── linkedin/      # profile-extractor (5)
│   ├── job/           # job-extractor (10), matcher (19)
│   └── analyzer/      # career-analyzer (9), prompt-builder (18), prompt-builder-job-mode (25), tools (6), logger (12), agent-contract (17), schema-boundary (28)
└── fixtures/          # Shared test data
```

**182 test cases across 14 test files.**

### Mocking pattern

The project uses Vitest's `vi.hoisted()` for Mastra agent mocks — the mock factory must be created before the `vi.mock()` call due to module hoisting:

```typescript
const { generateMock, getAgentMock } = vi.hoisted(() => {
    const generate = vi.fn();
    return {
        generateMock: generate,
        getAgentMock: vi.fn(() => ({ generate })),
    };
});

vi.mock("@mastra/core", () => ({
    Mastra: vi.fn(() => ({ getAgent: getAgentMock })),
}));
```

---

## Roadmap

See [ROADMAP.md](ROADMAP.md) for the full phase plan.

| Phase | Module                                 | Status         |
| ----- | -------------------------------------- | -------------- |
| 0     | Project scaffolding                    | ✅ Complete    |
| 1     | PDF parser                             | ✅ Complete    |
| 2     | GitHub client                          | ✅ Complete    |
| 3     | Candidate extraction (Mastra + NVIDIA NIM) | ✅ Complete    |
| 3b    | LinkedIn extraction                    | ✅ Complete    |
| 4     | Prompt builder                         | ✅ Complete    |
| 5     | Career analyzer orchestrator + tools   | ✅ Complete    |
| 5b    | Job description analysis + matching    | ✅ Complete    |
| 6     | Output formatter                       | ✅ Complete    |
| 7     | CLI entry point (commander)            | ⬜ Not started |
| 8     | End-to-end validation                  | ⬜ Not started |
| 9     | LlamaParse for structured PDF parsing  | 📋 Post-PoC    |
| 10    | Multi-agent experience verification    | 📋 Post-PoC    |
| 11    | Vector storage for RAG-based search    | 📋 Post-PoC    |

---

## Environment Variables

| Variable                       | Required | Description                                                 |
| ------------------------------ | -------- | ----------------------------------------------------------- |
| `NIM_API_KEY`                  | Yes      | NVIDIA NIM API key for all AI extraction and analysis       |
| `GITHUB_TOKEN`                 | Yes      | GitHub personal access token (read-only scope)              |
| `EXTRACTION_MODEL`             | No       | Extraction model override (default: `meta/llama-3.1-8b-instruct`) |
| `ANALYSIS_MODEL`               | No       | Analysis model override (default: `nvidia/llama-3.3-nemotron-super-49b-v1`) |
| `JOB_INPUT`                    | No       | Fallback job input when `--job` flag is not provided on CLI |

---

## Technology Deep Dive

This section explains how the four core technologies work together, with real code examples from the project. Read it in order — each layer builds on the one before.

---

### Zod — Runtime Validation at Every Boundary

Zod is the **foundation** of the project. Every piece of data from an external source (AI model, GitHub API, user input) is validated at runtime with a Zod schema.

#### Schema → Type Inference

```typescript
import { z } from "zod";

// 1. Define the runtime schema
export const roleSchema = z.object({
    title: z.string().nullable(),
    technologies: z.array(z.string()),
});

// 2. TypeScript type is INFERRED — single source of truth
export type Role = z.infer<typeof roleSchema>;
// Role = { title: string | null; technologies: string[] }
```

**Why this matters:** You write the schema once. The TypeScript type is automatic. Add a field to the schema → TypeScript tells you everywhere that's missing it.

#### Custom Validation

```typescript
// src/types/candidate/profile.ts
const YEAR_OR_MONTH = z
    .string()
    .regex(
        /^(\d{4}(-\d{2})?|present)$/i,
        'Use YYYY, YYYY-MM, or the literal string "present".'
    );
```

If the model returns `"2025-13"` (invalid month) or `"next year"`, Zod catches it at runtime with a clear error message.

#### The Double-Validation Pattern (defense in depth)

```typescript
// src/modules/candidate/profile-extractor.ts
// Step 1: Agent returns structured output (Mastra negotiates schema with model)
const result = await agent.generate([{ role: "user", content: resumeText }], {
    output: candidateProfileSchema,
});

// Step 2: Re-parse with Zod (defense in depth)
return candidateProfileSchema.parse(result.object);
```

Mastra already validates the output against the schema internally. But we parse again because:

- The Zod schema might have been updated between agent definition and use
- It's a zero-cost safety net that prevents silent `undefined` propagation

#### Every External Boundary Is Validated

The same pattern repeats across all modules:

- **GitHub API** → raw GraphQL responses validated via `github-response.ts`, then mapped to clean types validated via `github.ts`
- **Job extraction** → `jobDescriptionSchema.parse(result.object)` in `job-extractor.ts:75`
- **LinkedIn extraction** → same double-validation as candidate
- **Agent tools** → `inputSchema` / `outputSchema` on every tool in `tools.ts`

#### Key Zod APIs Used

| API                             | Usage                      | Example                                |
| ------------------------------- | -------------------------- | -------------------------------------- |
| `z.object({...})`               | Define structured schemas  | `candidateProfileSchema`               |
| `z.string().regex(...)`         | Pattern validation         | Date format `YYYY-MM`                  |
| `z.array(z.string()).max(5)`    | Bounded lists              | `topSkills` cap at 5                   |
| `z.nullable()`                  | Optional fields            | `title: z.string().nullable()`         |
| `z.enum([...])`                 | Fixed set of values        | Seniority level in job schema          |
| `z.infer<typeof schema>`        | Derive TS type             | `type CandidateProfile = z.infer<...>` |
| `schema.parse(data)`            | Validate + return or throw | Double-validation in extractors        |
| `z.object({...}).describe(...)` | Add metadata               | Self-documenting schemas               |

---

### Vercel AI SDK (`@ai-sdk/openai`) — Model Binding

The Vercel AI SDK provides a **provider-agnostic** interface to language models. This project uses `@ai-sdk/openai` pointed at NVIDIA NIM's OpenAI-compatible endpoint, but switching to OpenAI, Anthropic, or Azure requires changing only the import, base URL, and model string.

#### How the Model Is Created

```typescript
// src/llm/provider.ts
import { createOpenAI } from "@ai-sdk/openai";

const nim = createOpenAI({
    baseURL: "https://integrate.api.nvidia.com/v1",
    apiKey: process.env.NIM_API_KEY,
    compatibility: "compatible",
});
```

The `createOpenAI()` function returns an OpenAI-compatible client. Every provider (`@ai-sdk/google`, `@ai-sdk/anthropic`, etc.) exports a function with the same interface.

#### Provider Agnosticism in Practice

To switch from NVIDIA NIM to GPT-4o, the change is:

```diff
- const nim = createOpenAI({ baseURL: "https://integrate.api.nvidia.com/v1", ... });
+ import { openai } from "@ai-sdk/openai";

- return nim(modelName, options);
+ return openai("gpt-4o", options);
```

Everything else — Mastra agent, tools, structured output — stays unchanged because they all consume the `LanguageModel` interface.

#### Configurable via Environment Variable

All four agents follow this pattern:

```typescript
const DEFAULT_EXTRACTION_MODEL = "meta/llama-3.1-8b-instruct";
const extractionModel =
    process.env.EXTRACTION_MODEL?.trim() || DEFAULT_EXTRACTION_MODEL;
```

Set `EXTRACTION_MODEL=meta/llama-3.1-70b` in `.env` and every extraction agent switches without code changes.

#### Temperature 0

All agents use `temperature: 0` for **deterministic output**. This is critical for extraction agents — you want the same resume to produce the same structured profile every time. Creative variation is undesirable when parsing structured data.

---

### Mastra — Agent Framework

Mastra is the orchestration layer. It provides: agent lifecycle, tool binding, structured output negotiation, and observability.

#### What Is a Mastra Agent?

An agent = **a model + system instructions + optional tools**.

```typescript
// src/modules/candidate/extraction-agent.ts
export const candidateExtractionAgent = new Agent({
    name: "candidate-extraction-agent",
    instructions: [
        "You are an expert HR data analyst extracting structured data from resumes.",
        "- If information is missing, return null for that specific field.",
        '- Normalize technology names: "JavaScript" (not "JS"), "TypeScript" (not "TS").',
        // ...
    ].join("\n"),
    model: getModel(extractionModel, { temperature: 0 }),
});
```

The `instructions` string becomes the **system prompt**. Mastra sends it to the model on every call, before the user message.

#### The Four Agents in This Project

| Agent                      | File                            | Responsibility                                          |
| -------------------------- | ------------------------------- | ------------------------------------------------------- |
| `candidateExtractionAgent` | `candidate/extraction-agent.ts` | Resume PDF → structured `CandidateProfile`              |
| `linkedinExtractionAgent`  | `linkedin/extraction-agent.ts`  | LinkedIn PDF → structured `LinkedInProfile`             |
| `jobExtractionAgent`       | `job/extraction-agent.ts`       | Job posting (URL or text) → structured `JobDescription` |
| `careerAnalysisAgent`      | `analyzer/analysis-agent.ts`    | All data + goal → career analysis (uses tools)          |

#### Structured Output — Mastra's Killer Feature

```typescript
// src/modules/candidate/profile-extractor.ts
const result = await agent.generate(
    [{ role: "user", content: resumeText }],
    { output: candidateProfileSchema } // ← Pass a Zod schema
);
```

Mastra does three things when you pass `{ output: schema }`:

1. **Converts the Zod schema to JSON Schema** — understands `z.string()`, `z.array()`, `z.nullable()`, `.max(5)`, etc.
2. **Tells the model to respond in this exact JSON shape** — the model returns structured data, not free text
3. **Validates the response** against the schema and surfaces errors immediately

Without Mastra, you'd need to:

- Ask for JSON in the prompt (fragile — models sometimes forget)
- Parse the string yourself (`JSON.parse`)
- Validate against Zod manually
- Handle malformed JSON (retry logic)

Mastra does all of this in `agent.generate()`.

#### Agent Tools — Letting the Agent Fetch More Data Mid-Reasoning

```typescript
// src/modules/analyzer/tools.ts
export const fetchGithubRepoTool = createTool({
    id: "fetch_github_repo",
    description:
        "Fetch full details and README for a specific GitHub repository...",
    inputSchema: z.object({
        slug: z.string().describe('Repository slug in "owner/repo" format'),
    }),
    outputSchema: githubRepoSchema,
    execute: async ({ context }) => {
        return fetchRepoBySlug(context.slug);
    },
});
```

A tool has four parts:

- **`id`** — unique name the model uses to call it
- **`description`** — tells the model **when** to use it (critical — the model decides based on this)
- **`inputSchema` + `outputSchema`** — Zod schemas for runtime validation of tool I/O
- **`execute`** — the actual function

The `careerAnalysisAgent` registers two tools (`analysis-agent.ts:42-45`):

```typescript
tools: {
    fetch_github_repo: fetchGithubRepoTool,
    fetch_top_github_repos: fetchTopGithubReposTool,
},
```

When the agent is generating and realizes "I need more context about a repository the resume mentions," it:

1. Pauses generation
2. Calls `fetch_github_repo` with a slug
3. Mastra validates the input, runs `execute`, validates the output
4. Returns the result to the model
5. Model continues generating with the new context

#### Central Agent Registry

```typescript
// src/mastra.ts
export const mastra = new Mastra({
    agents: {
        candidateExtractionAgent,
        careerAnalysisAgent,
        jobExtractionAgent,
        linkedinExtractionAgent,
    },
});
```

All agents registered in one place enables Mastra's built-in **observability**: traces, token accounting, latency tracking per agent call, and tool invocation logging.

Agents are looked up by name elsewhere:

```typescript
const agent = mastra.getAgent("candidateExtractionAgent");
const result = await agent.generate(messages, { output: schema });
```

---

### How They All Fit Together — Complete Flow

Let's trace one extraction end-to-end to see the layering:

```
                    Zod                        Vercel AI SDK
                     │                             │
                     ▼                             ▼
  profile-extractor.ts ──► extraction-agent.ts ──► getModel("meta/llama-3.1-8b-instruct")
       │                       │                        │
       │  "output: schema"     │ instructions            │ returns JSON matching schema
       └───────────────────────┴────────────────────────┘
                     │
                     ▼
             Zod parses again
          (defense in depth)
                     │
                     ▼
            CandidateProfile ✓
```

1. **User** calls `extractCandidateProfile({ filePath })`
2. **extractor** validates API key, reads PDF text via `unpdf`
3. **extractor** calls `agent.generate(userMessage, { output: candidateProfileSchema })`
4. **Mastra** converts the Zod schema to JSON Schema, appends it to the system instructions
5. **Mastra** sends the full prompt to the model via **Vercel AI SDK's `getModel()` provider**
6. **NVIDIA NIM** returns structured JSON matching the requested schema
7. **Mastra** validates the response against the schema, returns `result.object`
8. **extractor** calls `candidateProfileSchema.parse(result.object)` — second validation
9. Returns a fully typed `CandidateProfile` to the caller

Each layer has one job:

| Layer                | Responsibility                                                              |
| -------------------- | --------------------------------------------------------------------------- |
| **Zod**              | Runtime validation + TypeScript type inference                              |
| **Vercel AI SDK**    | Model-agnostic API call (swap provider by changing one import)              |
| **Mastra**           | Agent lifecycle, tool binding, structured output negotiation, observability |
| **Application code** | Orchestration, error handling, logging                                      |

---

_Built with TypeScript, Mastra, NVIDIA NIM, and Zod._
