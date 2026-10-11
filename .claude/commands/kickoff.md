# /kickoff

Read CLAUDE.md. Read current records before answering.

```bash
npm run onboarding -- kickoff --project="Implementation"
```

Use --json for structured results. If a name is ambiguous, show every candidate and ask which record. Never choose the first match.

Report the records, dates, evidence and next action in plain language. Respect launch and dependency refusals. Do not change the database directly to bypass a refusal.
