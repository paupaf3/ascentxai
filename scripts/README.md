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
