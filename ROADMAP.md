# AscentX — Development Roadmap

## Guiding Principles

- Each phase produces a working, testable increment.
- No phase depends on a future phase to be runnable.
- Modules are built in dependency order: leaves first, orchestrator last.
- The CLI is wired last, once all modules are independently verified.

---

## Phase 0 — Project Scaffolding

**Status: ✅ Complete**

**Goal:** A clean, runnable TypeScript project with no business logic yet.

**Tasks:**

- [x] Initialize the project with `npm init`
- [x] Install and configure TypeScript (`tsconfig.json`)
    - Target: `ES2022`
    - Module: `CommonJS`
    - Strict mode: `true`
    - Output dir: `dist/`
    - Root dir: `src/`
- [x] Install `ts-node` and `tsx` for local execution
- [x] Install `dotenv` and create `.env` with placeholder keys
- [x] Create `.gitignore` — exclude `node_modules/`, `dist/`, `.env`
- [x] Create the full directory tree as defined in `ARCHITECTURE.md`
- [x] Verify the project compiles with `npx tsc --noEmit`

---

## Phase 1 — PDF Parser Module

**Status: ✅ Complete**

**Goal:** A working, independently testable resume text extractor.

**Module:** `src/modules/candidate/pdf-parser.ts`

**Tasks:**

- [x] Install `unpdf` (zero-dependency, chosen over `pdf-parse`)
- [x] Implement `parsePdfFromPath(filePath: string): Promise<string>`
    - Read file from path using `fs/promises`
    - Validate `.pdf` extension before reading
    - Extract text via `unpdf`
    - Return full text as a single string
- [x] Implement `parsePdfFromBuffer(buffer: Buffer | Uint8Array): Promise<string>`
- [x] Implement typed error: throw if file not found, wrong extension, or empty result
- [x] Unit tests: 6 tests covering path/buffer input, validation, edge cases

**Completion criteria:** Met — `parsePdfFromPath('./resume.pdf')` returns a
non-empty string of readable text from any standard PDF resume.

---

## Phase 2 — GitHub Client Module

**Status: ✅ Complete**

**Goal:** A working, independently testable GitHub portfolio fetcher.

**Modules:**

- `src/modules/github/github-client.ts`
- `src/modules/github/github-queries.ts`
- `src/modules/github/github-mapper.ts`
- `src/types/github/github.ts`
- `src/types/github/github-response.ts`

**Tasks:**

- [x] Install `@octokit/graphql`
- [x] Define Zod schemas for `GithubRepo` and `GithubProfile` (with runtime validation)
- [x] Define raw response validation schemas (`github-response.ts`)
- [x] Write GraphQL query to fetch user profile + pinned repositories (up to 6):
    - Profile: name, bio, location, company, website, avatar, followers, following
    - Per repo: name, description, primary language, URL
- [x] Implement README fetching per repository (default branch HEAD)
- [x] Implement `fetchProfile(username: string): Promise<GithubProfile>`
- [x] Implement `fetchRepo(owner: string, repo: string): Promise<GithubRepo>`
- [x] Implement `fetchRepoBySlug(slug: string): Promise<GithubRepo>` (parses `"owner/repo"`)
- [x] Typed errors: username not found, repo not found, API error wrapping
- [x] Unit tests: 11 tests covering profile fetching, repo fetching, error cases, null mapping
- [x] Manual test script: `scripts/github-test.ts`

**Completion criteria:** Met — `fetchProfile('username')` returns a fully typed
`GithubProfile` with name, language, and README per pinned repo.

---

## Phase 3 — Candidate Extraction Pipeline

**Status: ✅ Complete** _(replaces the originally planned hand-rolled AI Provider Abstraction)_

**Goal:** A structured, validated JSON profile extracted from a resume PDF using
a Mastra agent and Gemini 2.5 Flash. This phase superseded the planned
`AIProvider` interface + `GeminiProvider` class in favor of Mastra + Vercel AI SDK,
which provide provider swapping, structured output, and observability out of the box.

> **Note:** The files `src/modules/ai/ai-provider.ts`, `src/modules/ai/gemini-provider.ts`,
> and `src/modules/ai/provider-factory.ts` remain as empty stubs and can be removed.

**Modules:**

- `src/modules/candidate/extraction-agent.ts`
- `src/modules/candidate/profile-extractor.ts`
- `src/types/candidate/profile.ts`
- `src/mastra.ts`

**Tasks:**

- [x] Install `@mastra/core` and `@ai-sdk/google`
- [x] Define `CandidateProfile` Zod schema (`src/types/candidate/profile.ts`)
    - Contact info, experience, per-role technologies, skill taxonomy, education, certifications
    - Canonical skill names matching GitHub's `primaryLanguage` field
    - Nullable fields for missing data; date format validation (YYYY, YYYY-MM, "present")
    - `topSkills: string[]` capped at 5
- [x] Implement `candidateExtractionAgent` (Mastra agent bound to `gemini-2.5-flash`)
    - Model configurable via `GOOGLE_GENERATIVE_AI_MODEL` env var
    - Instructions for HR data extraction, canonical naming, null policy
- [x] Implement `extractCandidateProfile(input)` service in `profile-extractor.ts`
    - Accepts file path or buffer
    - Validates API key, calls agent, validates response with Zod
- [x] Register agent on central `Mastra` instance (`src/mastra.ts`)
- [x] Unit tests: 4 tests (path/buffer input, API key validation, schema validation) + schema tests (9 tests)
- [x] Manual test script: `scripts/extract-resume.ts`

**Completion criteria:** Met — `extractCandidateProfile({ filePath })` returns a
validated `CandidateProfile` JSON from any standard PDF resume.

---

## Phase 3b — LinkedIn Profile Extraction Module

**Status: ✅ Complete**

**Goal:** A structured, validated JSON profile extracted from a LinkedIn PDF
export, providing peer-validated signals (endorsements, recommendations) that
complement the resume and GitHub data.

**Modules:**

- `src/modules/linkedin/extraction-agent.ts`
- `src/modules/linkedin/profile-extractor.ts`
- `src/types/linkedin/linkedin-profile.ts`

**Tasks:**

- [x] Define `LinkedInProfile` Zod schema (`src/types/linkedin/linkedin-profile.ts`)
    - Reuses `roleSchema`, `skillsSchema`, `educationEntrySchema`, `certificationSchema`,
      `spokenLanguageSchema` from `types/candidate/profile.ts`
    - LinkedIn-specific fields: `endorsedSkills` (with peer counts), `recommendations`
      (verbatim), `connections`, `courses`, `volunteerExperience`, `projects`, `publications`
- [x] Implement `linkedinExtractionAgent` (Mastra agent bound to `gemini-2.5-flash`)
    - Tuned for LinkedIn PDF section order (About, Experience, Skills, Recommendations, etc.)
    - Extracts endorsement counts separately from the skill taxonomy
    - Normalizes connection count ("500+" → `500`)
    - Copies recommendations verbatim
- [x] Implement `extractLinkedInProfile(input)` service in `profile-extractor.ts`
    - Reuses `parsePdfFromPath` / `parsePdfFromBuffer` from `candidate/pdf-parser.ts`
    - Injects today's date for duration calculations
    - Validates API key, calls agent, validates response with Zod
- [x] Register `linkedinExtractionAgent` on central `Mastra` instance
- [x] Unit tests: 5 tests (path/buffer input, API key validation, schema validation, date injection)
- [x] Manual test script: `scripts/extract-linkedin.ts`

**Completion criteria:** Met — `extractLinkedInProfile({ filePath })` returns a
validated `LinkedInProfile` JSON from a standard LinkedIn PDF export.

---

## Phase 4 — Prompt Builder Module

**Status: ✅ Complete**

**Goal:** A deterministic, testable function that produces the full structured
prompt from three or four data inputs depending on whether LinkedIn data is available.

**Module:** `src/modules/analyzer/prompt-builder.ts`

**Tasks:**

- [x] Implement `buildPrompt(profile, portfolio, goal, linkedinProfile?)`: string`
    - AscentX system role preamble
    - `CandidateProfile` serialized: top skills, skill taxonomy, roles with tech stacks, education
    - `GithubProfile` serialized: repo name, primary language, description, README excerpt
      (first 600 chars with `…` truncation)
    - Goal injected under a labeled section
    - When `linkedinProfile` is provided:
        - Adds `=== LINKEDIN PROFILE ===` section with endorsed skills (with counts),
          recommendations, courses, and volunteer experience
        - Adds cross-check instructions (flag discrepancies between `topSkills` and endorsement counts)
        - Numbers data sources 1–4 instead of 1–3
    - Output instructions for three verbatim-headed sections:
        - `## Current Standing`
        - `## Technical Blind Spots` (exactly 3 numbered items)
        - `## The Level-Up Roadmap` (Hero Project with stack, addressed blind spots, done-enough milestone)
    - Response capped at 600 words in the instructions
- [x] Unit tests: 16 tests — original 9 plus 7 new covering LinkedIn section presence/absence,
      endorsed skills, recommendations, courses, data source numbering, and sparse LinkedIn profiles

**Completion criteria:** Met — `buildPrompt()` returns a complete, human-readable
prompt string with all data points embedded and clear output instructions, with and
without LinkedIn data.

---

## Phase 5 — Career Analyzer Orchestrator

**Status: ✅ Complete**

**Goal:** A single function that wires all modules together in parallel and
returns the final analysis string end-to-end. LinkedIn is an optional third
data source.

**Module:** `src/modules/analyzer/career-analyzer.ts`

**Tasks:**

- [x] Implement `analyze(resumePath, githubUsername, target: AnalysisTarget, linkedinPath?): Promise<string>`
    1.  Run in parallel via `Promise.all`:
        - `extractCandidateProfile({ filePath: resumePath })` → `profile`
        - `fetchProfile(githubUsername)` → `portfolio`
        - `extractLinkedInProfile({ filePath: linkedinPath })` → `linkedinProfile` (or `null`)
    2.  Call `buildPrompt(profile, portfolio, goal, linkedinProfile)` → `prompt`
    3.  Run `careerAnalysisAgent` with the prompt → `analysis: string`
    4.  Return `analysis`
- [x] LinkedIn extraction runs in the same `Promise.all` as resume and GitHub —
      no added latency when all three sources are provided
- [x] Define `fetch_github_repo` and `fetch_top_github_repos` tools in `analyzer/tools.ts`
    - Tools are read-only; wrap existing `fetchRepoBySlug` and `fetchTopRepositories`
    - Both carry Zod `inputSchema` / `outputSchema` for runtime validation by Mastra
- [x] Add `fetchTopRepositories(username, limit?)` to `github-client.ts` with a new
      `TOP_REPOS_QUERY` (public, non-forked, ordered by stars)
- [x] Register tools on `careerAnalysisAgent`; update instructions with explicit
      when-to-use guidance and a "do not call speculatively" rule
- [x] Unit tests: 9 tests for the orchestrator + 4 for `fetchTopRepositories` +
      6 for the tools (delegate correctly, propagate errors, handle empty results)
- [x] Manual test script: `scripts/analyze.ts` with optional LinkedIn path detection

**Completion criteria:** Met — `analyze()` returns a complete AI-generated analysis
string when called with valid inputs, with or without a LinkedIn path, and with
either a goal string or an `AnalysisTarget` for job mode.

> **Note:** After Phase 5 was completed, the job description analysis mode
> (`--job` flag, `job/` module, `matcher.ts`) was added. See Phase 5b below.

---

## Phase 5b — Job Description Analysis Mode

**Status: ✅ Complete**

**Goal:** Add a second analysis mode alongside the existing goal mode: given a
job posting (URL or inline text), extract a structured `JobDescription`, compute
an algorithmic match scorecard against the candidate's profile, and generate a
targeted analysis with blind spots, quick wins, and a roadmap.

**Modules:**

- `src/modules/job/extraction-agent.ts`
- `src/modules/job/job-extractor.ts`
- `src/modules/job/matcher.ts`
- `src/types/job/job-description.ts`
- `src/types/analysis-target.ts`

**Tasks:**

- [x] Define `AnalysisTarget` discriminated union: `{ mode: "goal", goal }` | `{ mode: "job", jobInput }`
- [x] Define `JobDescription` Zod schema with required/preferred skills, seniority, responsibilities, domain
- [x] Define `MatchResult` and `SkillMatch` interfaces for algorithmic scoring
- [x] Implement `jobExtractionAgent` (Mastra agent tuned for job posting extraction)
- [x] Implement `extractJobDescription(input)` service: URL fetch with HTML stripping or inline text → agent → Zod validation
- [x] Implement `computeMatch(profile, portfolio, job)` with weighted scoring (45% required skills, 25% experience, 20% tech depth, 10% preferred)
- [x] Register `jobExtractionAgent` on central `Mastra` instance
- [x] Refactor `analyze()` signature: `goal: string` → `target: AnalysisTarget`
- [x] Refactor `buildPrompt()` to accept `target`, `jobDescription`, `matchResult` params
- [x] Add `--job` flag and `JOB_INPUT` env var fallback to `scripts/analyze.ts`
- [x] Add `buildJobPrompt()` with five-section output (Match Summary, Current Standing, Technical Blind Spots, Quick Wins, The Level-Up Roadmap)
- [x] Add match scorecard formatting with visual bar charts
- [x] Update `career-analyzer.test.ts` and `prompt-builder.test.ts` for new `AnalysisTarget` signature
- [x] Update `RunLogger` to log `target` instead of `goal`

**Completion criteria:** `npm run analyze -- ./resume.pdf johndoe --job "Staff Engineer at a B2B SaaS company"` produces a coherent analysis with a match scorecard and job-specific section headings.

---

## Phase 6 — Output Formatter

**Status: ⬜ Not started**

**Goal:** A clean terminal rendering of the analysis with a consistent layout.

**Module:** `src/output/formatter.ts`

**Tasks:**

- [ ] Implement `render(analysis: string): void`
    - Print a top border and tool header with run timestamp
    - Print the analysis content as-is
    - Print a bottom border
- [ ] Write directly to `process.stdout`
- [ ] No transformation of content — render what the AI returns

**Completion criteria:** `render(analysisString)` prints a clearly structured,
readable block to the terminal with header and timestamp.

---

## Phase 7 — CLI Entry Point

**Status: ⬜ Not started**

**Goal:** The fully wired CLI tool, ready for end-to-end use.

**Module:** `src/cli/index.ts`

**Tasks:**

- [ ] Install `commander` (`npm install commander`)
- [ ] Define the CLI program with options:
    - `--resume <path>` (required)
    - `--github <username>` (required)
    - `--linkedin <path>` (optional)
    - `--goal "<role>"` (optional)
- [ ] Implement `--goal` interactive fallback using Node's `readline`
    - If `--goal` is not provided, prompt: `What is your target role or level? >`
    - Wait for stdin input before proceeding
- [ ] Validate `--resume` and `--linkedin` paths: files must exist and have `.pdf` extension
- [ ] Call `analyze()` and pass the result to `render()`
- [ ] Implement the top-level error boundary:
    - Catch all errors from any module
    - Print a human-readable message to `stderr`
    - Exit with code `1`
- [ ] Load `.env` at startup via `dotenv/config`

**Completion criteria:** Both CLI usage modes work end-to-end:

- Flag mode: `npx tsx src/cli/index.ts --resume ./resume.pdf --github username --goal "..."`
- Interactive mode: same command without `--goal`, followed by stdin input
- With LinkedIn: add `--linkedin ./linkedin.pdf`

---

## Phase 8 — End-to-End Validation

**Status: ⬜ Not started**

**Goal:** Confirm the full pipeline works correctly on real data before the PoC
is considered complete.

**Tasks:**

- [ ] Run a full end-to-end test with:
    - A real PDF resume
    - A real GitHub username with pinned repositories
    - A real LinkedIn PDF export
    - A realistic goal string
- [ ] Verify the output contains all three required sections:
    - Current Standing
    - Technical Blind Spots (3 items)
    - The Level-Up Roadmap
- [ ] Verify error handling for each known failure case:
    - Invalid PDF path
    - Non-existent GitHub username
    - Missing `GOOGLE_GENERATIVE_AI_API_KEY`
    - Missing `GITHUB_TOKEN`
- [ ] Review prompt output quality — adjust `prompt-builder.ts` if sections
      are missing or poorly structured

**Completion criteria:** The tool produces a coherent, correctly structured
analysis on the first run with real data, and all error cases produce clear
messages with a non-zero exit code.

---

## Phase Summary

| Phase | Module(s)                                              | Status         | Deliverable                              |
| ----- | ------------------------------------------------------ | -------------- | ---------------------------------------- |
| 0     | Project root                                           | ✅ Complete    | Compilable TypeScript scaffold           |
| 1     | `candidate/pdf-parser.ts`                              | ✅ Complete    | PDF text extraction (path + buffer)      |
| 2     | `github/github-client.ts` + queries + mapper           | ✅ Complete    | GitHub profile + pinned repos fetcher    |
| 3     | `candidate/extraction-agent.ts` + `profile.ts`         | ✅ Complete    | Structured candidate profile (Mastra)    |
| 3b    | `linkedin/extraction-agent.ts` + `linkedin-profile.ts` | ✅ Complete    | Structured LinkedIn profile (Mastra)     |
| 4     | `analyzer/prompt-builder.ts`                           | ✅ Complete    | Structured prompt assembly (3–4 sources) |
| 5     | `analyzer/career-analyzer.ts` + `analyzer/tools.ts`    | ✅ Complete    | End-to-end orchestrator + agent tools    |
| 5b    | `job/` module + `AnalysisTarget`                       | ✅ Complete    | Job description analysis mode + matching |
| 6     | `output/formatter.ts`                                  | ⬜ Not started | Terminal output renderer                 |
| 7     | `cli/index.ts`                                         | ⬜ Not started | Fully wired CLI with fallback input      |
| 8     | Full pipeline                                          | ⬜ Not started | Validated PoC on real data               |

---

## Phase 9 — Structured Resume Parsing via LlamaParse

**Goal:** Move from raw text extraction (`unpdf`) to LlamaParse to get
structured Markdown — preserving headings, lists, and tables — which
measurably improves downstream LLM extraction quality on complex resume
layouts (two-column, sidebar, heavily tabular CVs).

**Tasks:**

- [ ] Evaluate LlamaParse against a fixture set of 20 diverse resumes
- [ ] Introduce a `ResumeParser` interface with `unpdf` and `llamaparse`
      implementations; route via env flag
- [ ] Update `profile-extractor.ts` to accept Markdown input
- [ ] Benchmark extraction accuracy vs. the `unpdf` baseline

**Completion criteria:** Extraction quality on the fixture set is strictly
better than the `unpdf` baseline with no regressions on simple layouts.

---

## Phase 10 — Multi-Agent Review of Years-of-Experience

**Goal:** Add a second Mastra agent that independently verifies the
`totalYearsOfExperience` figure produced by `candidateExtractionAgent`,
flagging discrepancies instead of silently trusting a single pass.

**Tasks:**

- [ ] Define `experienceReviewAgent` with a strict arithmetic-checking
      prompt and the raw work history as input
- [ ] Introduce a Mastra workflow that fans out extraction and review, then
      reconciles the two outputs
- [ ] Emit a `confidence` field on `CandidateProfile` when both agents agree
- [ ] Log disagreements for manual review

**Completion criteria:** Disagreement rate on a labeled fixture set is
measurable and drops below a target threshold after prompt iteration.

---

## Phase 11 — Vector Storage for RAG-Based Candidate Search

**Goal:** Persist extracted candidate profiles and their source resume
chunks in a vector store so recruiters can run semantic searches like
"senior backend engineers with Kafka and a physics background."

**Tasks:**

- [ ] Choose a vector store (pgvector or a managed option) and wire it
      through Mastra's storage abstraction
- [ ] Chunk + embed resume text on ingest; store alongside the structured
      `CandidateProfile`
- [ ] Build a `searchCandidates(query)` service that combines vector recall
      with structured filters (years of experience, skills)
- [ ] Add an integration test that seeds a small corpus and asserts ranked
      retrieval quality

**Completion criteria:** Semantic queries over a seeded corpus return the
expected top-K candidates, and ingestion is idempotent on re-runs.

---

## Post-PoC Considerations (Out of Scope for Now)

These are noted for future iterations and do not block the PoC:

- Persistence layer: store past analyses for comparison over time
- Additional AI providers: OpenAI, Claude (change the `model:` binding on the Mastra agent)
- Additional input formats: DOCX resume support (new parser in `src/modules/candidate/`)
- Web or API interface: `extractCandidateProfile` and `extractLinkedInProfile` accept buffers — compatible with Express/Next.js
- Structured JSON output mode alongside plain text
- Rate limiting and retry logic for GitHub and AI API calls
- Implement or remove empty stubs: `src/cli/index.ts` (Phase 7), `src/output/formatter.ts` (Phase 6), `tests/cli/`, `tests/output/`
