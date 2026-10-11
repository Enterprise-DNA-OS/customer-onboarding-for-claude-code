# /add-project

Read CLAUDE.md. Use the operator's stated facts. Get the correct record, evidence and actor before recording a change.

```bash
npm run onboarding -- add-project --account="Customer name" --name="Implementation" --owner="Project lead" --start=YYYY-MM-DD --due=YYYY-MM-DD --hours=40 --actor="Operator name"
```

Use --json for structured results. If a name is ambiguous, show every candidate and ask which record. Never choose the first match.

Report the records, dates, evidence and next action in plain language. Respect launch and dependency refusals. Do not change the database directly to bypass a refusal.
