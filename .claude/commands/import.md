# /import

Read CLAUDE.md. Use the operator's stated facts. Get the correct record, evidence and actor before recording a change.

```bash
npm run onboarding -- import rocketlane --projects=imports/projects.csv --tasks=imports/tasks.csv --dry-run --actor="Operator name"
```

Use --json for structured results. If a name is ambiguous, show every candidate and ask which record. Never choose the first match.

Read docs/replace-rocketlane.md. Inspect export headings and mapping first. Show dry-run counts. Import the same files without --dry-run once the operator has asked to migrate. Compare record counts and completion states. Changed source rows stop for reconciliation. Never interpret imported completion as customer acceptance.
