# /task-status

Read CLAUDE.md. Use the operator's stated facts. Get the correct record, evidence and actor before recording a change.

```bash
npm run onboarding -- task-status --task="Work required" --status=done --evidence="Completion evidence" --actor="Operator name"
```

Use --json for structured results. If a name is ambiguous, show every candidate and ask which record. Never choose the first match.

Report the records, dates, evidence and next action in plain language. Respect launch and dependency refusals. Do not change the database directly to bypass a refusal.
