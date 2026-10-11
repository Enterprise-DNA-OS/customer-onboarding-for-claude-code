# Replace Rocketlane's onboarding register

Sources checked 11 October 2026: [Projects list export](https://help.rocketlane.com/support/solutions/articles/67000718035-the-projects-page-view-in-rocketlane), [All Tasks CSV export](https://help.rocketlane.com/support/solutions/articles/67000702601), [Project plan export](https://help.rocketlane.com/support/solutions/articles/67000740181-how-to-take-an-export-of-the-project-plan-).

## Export and inspect

Use the Projects list export and All Tasks list export. The project-list file includes selected columns, so include names, customer, owner and dates. Export all required records, not a filtered subset. The project plan's board export is PDF; use the list exports for this importer. Save copies privately under imports/.

The help articles describe configurable columns, not a fixed machine contract. Inspect the actual headings and a small sample. The fixtures in this repo are synthetic. Custom field names, date displays and statuses need mapping or normalisation before import. No promise is made that arbitrary account exports work without preparation.

| Record | Field | Accepted headings |
|---|---|---|
| Project | Source ID, optional | Project ID, ID |
| Project | Name | Project name, Project, Name |
| Project | Customer | Customer, Company, Customer name |
| Project | Owner | Project owner, Owner |
| Project | Start | Start Date |
| Project | Due | Due Date, End Date |
| Task | Source ID, optional | Task ID, ID |
| Task | Name | Task name, Task, Name |
| Task | Project reference | Project ID, Project, Project name |
| Task | Owner | Assignee, Owner |
| Task | Responsible | Responsible |
| Task | Due | Due Date |
| Task | Status | Status |

Headings match without case. Dates must be YYYY-MM-DD. Project references match a project in the same import by ID or unambiguous name. Without IDs, projects use customer/name and tasks use project/name as stable keys. Never rename records between repeat imports when relying on these keys. Multiple tasks with the same name in one project need explicit IDs. Duplicate keys fail.

Task statuses: To do, todo, Not started become todo; In progress and doing become doing; waiting and blocked become waiting; Completed, complete and done become done. Responsible accepts internal/team or customer/client. Convert your other values explicitly; they are not guessed.

A mapping file renames columns, not values:

```json
{"projects":{"name":"Implementation","customer":"Client"},"tasks":{"name":"Work item","due":"Target date"}}
```

Add --mapping=imports/mapping.json to the import.

## One command after the export is prepared

```bash
npm run onboarding -- import rocketlane --projects=imports/projects.csv --tasks=imports/tasks.csv --actor="Migration operator" --dry-run
npm run onboarding -- import rocketlane --projects=imports/projects.csv --tasks=imports/tasks.csv --actor="Migration operator"
```

Dry run uses a transaction then rolls back. Every row in both files is one transaction. A bad date, missing owner, unknown status or reference rolls it all back. Exact repeats skip; changed source rows stop for reconciliation rather than overwriting later work. All source fields are preserved.

Each project receives an Imported plan milestone, and its imported tasks belong there. All projects start active. Source completion is not customer acceptance; imported complete tasks carry an explanatory note and the import date. Historical source dates remain in the raw fields. Reconcile phases and milestone dates, establish dependencies and capture acceptance separately.

## Reconcile before cutover

Compare source and destination project/task counts and every mapped status. Check completed tasks and customer responsibilities. Inspect raw custom fields through export. Record notice assessment, security review and retention review for each account. Copy evidence files separately and verify access.

The compact import does not reconstruct phases, dependencies, comments, attachments, time entries, billing, signatures, portal users or integrations. Enterprise DNA maps these as part of an agreed migration. Keep the original export and compare a full review cycle before retiring the old workflow. Switching in a day means a prepared register import and verification, not a full PSA migration guarantee.
