# /add-task

Read CLAUDE.md. Use the operator's stated facts. Get the correct record, evidence and actor before recording a change.

```bash
npm run onboarding -- add-task --project="Implementation" --milestone="First value" --name="Work required" --owner="Named person" --responsible=customer --due=YYYY-MM-DD --hours=2 --actor="Operator name"
```

Use --json for structured results. If a name is ambiguous, show every candidate and ask which record. Never choose the first match.

Report the records, dates, evidence and next action in plain language. Respect launch and dependency refusals. Do not change the database directly to bypass a refusal.
