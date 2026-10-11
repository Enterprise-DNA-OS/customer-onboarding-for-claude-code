# Customer Onboarding for Claude Code

Own the plan from signed contract to accepted handover. Customer waits, task dependencies, acceptance evidence and launch decisions in one Postgres database. Use Claude Code, Codex, OpenCode or Cursor to operate it.

## Three ways to run it

- **Do it yourself.** Free under the MIT licence. Run the demo, import your records and maintain your own installation. Hosting and agent subscriptions are separate costs.
- **We customise it.** Enterprise DNA brings your Rocketlane data across, adds your fields, rules and documents, and builds a customer website or different technology stack if you need one. One setup fee, then a retainer for ongoing work.
- **We run it for you.** Installed, connected and operated inside Omni by Enterprise DNA. One setup fee, then a monthly retainer. [Book a call](https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=rocketlane&utm_medium=readme).

## Run the demo

Node 20 or newer. No database account required.

```bash
npm install
npm run demo
npm test
npm run onboarding -- weekly-review
npm run view
npm run docs
```

Without DATABASE_URL, PGlite stores records in .data/db. Set DATA_DIR for another directory. For shared Postgres, set DATABASE_URL, then run npm run migrate against an empty database. Demo seed is for a demo database only. Production starts with migrations and your own records; do not seed fictional records there. Date calculations use UTC.

Harbour Delivery Studio is fictional. Its demo includes a customer waiting to supply records, a stale overdue migration and a pilot ready for launch. Dates are relative to the first seed. Repeating the seed preserves existing work.

## Five weekly jobs

1. /kickoff: review the agreed work, owners and dates.
2. /customer-chase: find customer tasks holding up delivery.
3. /blockers: identify unfinished prerequisites.
4. /launch-readiness: check completed work and acceptance.
5. /handover: assemble the delivery record for review.

/weekly-review combines attention, launch-readiness and compliance. 32 CLI commands and 34 slash recipes ship. [Commands and flags](docs/cli.md). Names match without case; UUID prefixes must be unique. Ambiguous matches list candidates and exit 1. All commands accept --json.

## Acceptance is evidence, not a percentage

Every milestone needs at least one task. Every task must be complete before acceptance, and acceptance records who approved it and the evidence. Launch requires at least one milestone and task, every task complete and every milestone accepted. Adding or reopening a task clears its milestone acceptance. Reopening a launched project clears all its acceptances for fresh review. Dependencies cannot cross projects or form cycles. A completed prerequisite cannot reopen while a completed dependent still relies on it.

These are operator workflow guards. Database owners can change records directly. Actor labels are not authentication and activity history is not tamper-proof.

## Ten questions for the delivery meeting

These are questions this build answers today, not a claim that Rocketlane cannot produce comparable reports. Its own documentation describes custom reporting and dashboards. You own and can change the definitions here.

| Question | Command |
|---|---|
| Which launches still need customer acceptance? | launch-readiness |
| Which customer tasks are overdue? | customer-chase |
| Which internal work is blocked by prerequisites? | blockers |
| Which projects have gone quiet for more than a week? | attention |
| Which projects exceeded their planned hours? | effort-review |
| Who owns the largest overdue task list? | owner-load |
| Which milestone has evidence of customer acceptance? | milestones |
| What changed since the kickoff? | updates |
| Which customers need a privacy review? | compliance |
| What must the team resolve before this week's handovers? | weekly-review |

## Your first hour: ten things to ask for

1. Put our name and colours on the kickoff plan.
2. Show customers holding up delivery.
3. Find every unfinished prerequisite.
4. Tell me which projects have gone quiet.
5. Compare logged and planned hours.
6. Show the acceptance evidence for the pilot.
7. Draft the Harbour status note.
8. Test our Rocketlane export without saving it.
9. Add our implementation region through /customise.
10. Add a weekly customer-waits report through /new-view.

## Bring your history

```bash
npm run onboarding -- import rocketlane --projects=imports/projects.csv --tasks=imports/tasks.csv --actor="Migration operator" --dry-run
npm run onboarding -- import rocketlane --projects=imports/projects.csv --tasks=imports/tasks.csv --actor="Migration operator"
```

One command imports the project-list and task-list CSV files. It keeps raw source fields, validates names and dates, and rolls back the entire file pair on an error. Exact repeats skip; changed source rows require reconciliation. Configurable headings use --mapping. Custom statuses must be normalised first. See [the exact mapping and cutover guide](docs/replace-rocketlane.md). Fixtures are synthetic examples, not vendor-generated exports.

The imported plan starts active and unaccepted. A source task marked complete carries a source-completion note; its import date is recorded as the completion date because the compact mapping does not reconstruct historical completion times. Original values remain in source_data. Dependency links, customer sign-offs, files, comments, financial records and portal accounts require separate reconciliation.

## Documents and views

Change brand.json once. npm run docs produces a kickoff plan, acceptance record and handover pack per project. npm run view produces a weekly dashboard and privacy review. The HTML is read-only and printable. Keep it private. OUTPUT_DIR changes the output root. /draft-status and /draft-handover create internal drafts and never send them.

/compliance checks notice evidence and local retention/security review dates against documented principles. It cannot establish legal compliance. [Rules and sources](docs/compliance.md). /customise changes fields and rules through versioned migrations; /new-view adds a report. [What screens provide](docs/why-no-front-end.md).

## Verification and operation

The test suite uses a temporary database and exercises every command. It tests blocked launches, empty milestones, acceptance invalidation, dependency cycles and cross-project references, failed-import rollback, repeat imports, header mapping, dates, exports, HTML escaping, drafts and CLI exit codes. CI is configured for Windows and Linux on Node 20 and 22, plus Postgres 17. TEST_DATABASE_URL must point at a fresh disposable database.

RLS is enabled without public policies. This base uses a trusted operator connection; it is not a public customer portal. A shared installation needs authenticated access, restricted roles, backups, restore rehearsal and a policy for personal information. Export writes all seven record sets to JSON; it is an interchange snapshot, not an automatic restore. Back up the database and evidence files separately.

This is an onboarding operations base. It does not implement Rocketlane's financial management, live collaboration or integrations. No front end, email delivery or payment processing is included. MIT licence. Not affiliated with Rocketlane or Anthropic.
