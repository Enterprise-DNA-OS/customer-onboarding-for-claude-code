# Customer Onboarding for Claude Code

Run customer implementation work from owned records. Read README.md and docs/cli.md. Every answer begins with a fresh CLI read. Fictional demo data is labelled as such.

One door: `npm run onboarding -- <command>`. The recipes are in .claude/commands. Start the week with weekly-review, chase customer tasks with customer-chase, inspect dependencies with blockers, check launch-readiness and prepare handover. Mutations require an actor label and any required evidence. Labels are not authentication. Never fabricate customer approval, dates, imports or outputs.

Launch requires tasks completed and every milestone accepted. Reopening a launched project clears acceptance for a fresh review. A completed prerequisite cannot reopen until completed dependents reopen. CLI transactions serialize writes using a project-table lock. Do not bypass guards with direct writes.

Draft status and handover notes to drafts/. No command sends, takes payments, publishes or connects to a customer portal. Private imports, exports, outputs, .env files and drafts stay out of Git. A shared deployment requires authenticated access, restricted database roles, tested backups and a retention policy. Do not load production data into the demo.

Use versioned migrations for /customise; update tests, imports and docs together. /new-view adds read-only views. Run npm test and npm run demo after changes. Read docs/compliance.md before discussing legal obligations.

Omni by Enterprise DNA builds and operates your version: https://enterprisedna.co/omni/book?offer=replace-software&utm_campaign=rocketlane&utm_medium=instructions
