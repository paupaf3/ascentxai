# Scripts

Development and manual testing scripts. Not part of the production build.

---

## github-test.ts

Manually tests the GitHub module against the real API.

### Commands

**Fetch a user profile and their pinned repositories:**

```bash
npm run github:test -- profile <username>
```

**Fetch a specific repository:**

```bash
npm run github:test -- repo <owner/repo>
```

### Examples

```bash
npm run github:test -- profile torvalds
npm run github:test -- repo vercel/next.js
npm run github:test -- repo microsoft/typescript
```

### Output

`profile` prints the user's bio, location, company, follower count, and a
summary of each pinned repository including its primary language and the first
120 characters of its README.

`repo` prints the repository description, primary language, URL, and README
excerpt.

---

## extract-resume.ts

Manually tests the resume extraction pipeline (PDF -> Mastra agent ->
validated `CandidateProfile`) against the real Gemini API.

### Prerequisites

Set `GOOGLE_GENERATIVE_AI_API_KEY` in `.env` at the project root. The script
loads it automatically via `dotenv/config`.

### Command

```bash
npm run resume:extract -- <path-to-resume.pdf>
```

The path is resolved relative to the current working directory, so both
relative and absolute paths work.

### Examples

```bash
npm run resume:extract -- /home/user/docs/cv.pdf
```

### Output

Prints the full `CandidateProfile` as indented JSON to stdout: contact
details and links, `totalYearsOfExperience` (non-overlapping), the full
`roles[]` list with per-role `yearsInRole` and `technologies[]`, the
normalized `skills` taxonomy, `topSkills`, education, certifications, and
spoken languages.

Errors (missing API key, unreadable PDF, schema validation failure) are
printed to stderr and the process exits with a non-zero code.
