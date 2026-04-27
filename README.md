# AscentX.ai

AscentX.ai is a career-progression intelligence tool built with TypeScript. It analyzes the "delta" between your current professional footprint (resume, GitHub portfolio, and optionally LinkedIn) and your career goals, then produces a structured roadmap powered by an LLM.

## What it does

Given a PDF resume, a GitHub username, an optional LinkedIn PDF export, and a target role, AscentX:

1. Extracts a structured candidate profile from the resume (skills, roles, technologies)
2. Fetches the candidate's GitHub portfolio (pinned repos, languages, READMEs)
3. Optionally extracts the LinkedIn profile (endorsed skills with counts, recommendations, courses)
4. Cross-references all sources against the stated career goal
5. Produces a three-section analysis:
   - **Current Standing** — honest assessment of the current profile, cross-referencing resume and GitHub (and LinkedIn endorsements when available)
   - **Technical Blind Spots** — three specific gaps between the footprint and the goal
   - **The Level-Up Roadmap** — a concrete "Hero Project" to bridge those gaps

## Status

| Capability                          | Status      |
|-------------------------------------|-------------|
| PDF resume parsing                  | ✅ Working  |
| Structured candidate profile (AI)   | ✅ Working  |
| GitHub profile + pinned repo fetch  | ✅ Working  |
| LinkedIn PDF extraction (AI)        | ✅ Working  |
| Prompt assembly                     | ✅ Working  |
| Career analysis orchestrator        | ✅ Working  |
| Terminal output renderer            | ⬜ Planned  |
| CLI entry point                     | ⬜ Planned  |

See [ROADMAP.md](ROADMAP.md) for the full phase-by-phase plan.

## Tech stack

- **TypeScript** + **Node.js**
- **Mastra** — agent orchestration and observability
- **Vercel AI SDK** (`@ai-sdk/google`) — Gemini 2.5 Flash for extraction and analysis
- **unpdf** — zero-dependency PDF text extraction
- **@octokit/graphql** — GitHub GraphQL API (required for pinned repos)
- **Zod** — runtime schema validation throughout
- **vitest** — unit testing

## Requirements

- Node.js 18+
- A [Google AI API key](https://aistudio.google.com/apikey) (Gemini)
- A [GitHub personal access token](https://github.com/settings/tokens) (read-only scope is sufficient)

## Setup

```bash
git clone <repo>
cd ascentxai
npm install
cp .env.sample .env
# Fill in GOOGLE_GENERATIVE_AI_API_KEY and GITHUB_TOKEN in .env
```

## Usage

### Run the full analysis

```bash
# Resume + GitHub only
npm run analyze -- ./resume.pdf <github-username> "Staff Engineer at a B2B SaaS company"

# Resume + GitHub + LinkedIn (export your profile from LinkedIn → More → Save to PDF)
npm run analyze -- ./resume.pdf <github-username> ./linkedin.pdf "Staff Engineer at a B2B SaaS company"
```

### Individual extraction scripts

```bash
# Extract a structured profile from a PDF resume
npm run resume:extract -- ./resume.pdf

# Extract a structured profile from a LinkedIn PDF export
npm run linkedin:extract -- ./linkedin.pdf

# Fetch a GitHub profile and pinned repos
npm run github:test profile <username>
npm run github:test repo <owner/repo>
```

## Development

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # Coverage report
```

## Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for the full module breakdown, data flow diagram, and design rationale.

---

*Primary goal: hands-on experience with Agentic AI using Mastra and the Vercel AI SDK.*
