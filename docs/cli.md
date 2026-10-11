# Command reference

Run `npm run onboarding -- help` for the authoritative command and flag list. All 32 commands accept `--json`. Mutation commands require `--actor`.

## accounts

`npm run onboarding -- accounts`

## projects

`npm run onboarding -- projects`

## tasks

`npm run onboarding -- tasks`

## milestones

`npm run onboarding -- milestones`

## customer-chase

`npm run onboarding -- customer-chase`

## blockers

`npm run onboarding -- blockers`

## launch-readiness

`npm run onboarding -- launch-readiness`

## attention

`npm run onboarding -- attention`

## effort-review

`npm run onboarding -- effort-review`

## owner-load

`npm run onboarding -- owner-load`

## compliance

`npm run onboarding -- compliance`

## updates

`npm run onboarding -- updates`

## history

`npm run onboarding -- history`

## help

`npm run onboarding -- help`

## weekly-review

`npm run onboarding -- weekly-review`

## kickoff

`npm run onboarding -- kickoff --project="Implementation"`

## handover

`npm run onboarding -- handover --project="Implementation"`

## add-account

`npm run onboarding -- add-account --name="Customer name" --contact="Contact name" --actor="Operator name"`

## add-project

`npm run onboarding -- add-project --account="Customer name" --name="Implementation" --owner="Project lead" --start=YYYY-MM-DD --due=YYYY-MM-DD --hours=40 --actor="Operator name"`

## add-milestone

`npm run onboarding -- add-milestone --project="Implementation" --name="First value" --due=YYYY-MM-DD --actor="Operator name"`

## add-task

`npm run onboarding -- add-task --project="Implementation" --milestone="First value" --name="Work required" --owner="Named person" --responsible=customer --due=YYYY-MM-DD --hours=2 --actor="Operator name"`

## task-status

`npm run onboarding -- task-status --task="Work required" --status=done --evidence="Completion evidence" --actor="Operator name"`

## depend

`npm run onboarding -- depend --task="Dependent work" --needs="Prerequisite work" --actor="Operator name"`

## accept

`npm run onboarding -- accept --milestone="First value" --by="Customer reviewer" --evidence="Reference to their approval" --actor="Operator name"`

## launch

`npm run onboarding -- launch --project="Implementation" --evidence="Owner launch approval" --actor="Operator name"`

## reopen-project

`npm run onboarding -- reopen-project --project="Implementation" --evidence="Reason for reopening" --actor="Operator name"`

## log

`npm run onboarding -- log --project="Implementation" --note="What happened" --date=YYYY-MM-DD --hours=1 --actor="Operator name"`

## review-privacy

`npm run onboarding -- review-privacy --account="Customer name" --notice="Notice assessment and evidence" --retention=YYYY-MM-DD --security=YYYY-MM-DD --actor="Operator name"`

## import

`npm run onboarding -- import rocketlane --projects=imports/projects.csv --tasks=imports/tasks.csv --dry-run --actor="Operator name"`

## export

`npm run onboarding -- export --out=exports/onboarding.json`

## draft-status

`npm run onboarding -- draft-status --project="Implementation"`

## draft-handover

`npm run onboarding -- draft-handover --project="Implementation"`

Dates use YYYY-MM-DD. Hours are nonnegative. Identifiers accept an exact case-insensitive name or unique UUID prefix. Ambiguity lists candidates and exits 1. Unknown flags and arguments fail. Project-scoped creation checks that milestones and tasks belong to the selected project.
