# Privacy evidence checks for onboarding records

Sources checked 11 October 2026. These checks support a New Zealand implementation team handling customer contact information. They flag missing evidence, not proven legal breaches, and do not certify compliance. Australian deployments need a separate assessment against applicable Australian rules.

| Check | Principle and source | What the command checks |
|---|---|---|
| Notice assessment | [IPP3, direct collection](https://www.privacy.org.nz/privacy-principles/3/) and [IPP3A, indirect collection](https://www.privacy.org.nz/privacy-principles/3a/) | Account notice_evidence is blank. Record the collection context, notice provided, or the reviewed basis for an exception. |
| Security review | [IPP5, storage and security](https://www.privacy.org.nz/privacy-principles/5/) | Account security_review_on is missing or before today. This date is your next local review, not a statutory interval. |
| Retention review | [IPP9, retention](https://www.privacy.org.nz/privacy-principles/9/) | Account retention_review_on is missing or before today. Review whether holding the personal information remains necessary for a lawful purpose. |

IPP3 addresses information collected directly from a person. IPP3A applies to indirect collection from May 2026, subject to its exceptions. An import alone does not establish whether a fresh notice is required. The operator assesses the collection basis and records evidence, including any applicable exception. A filled text field is not proof that the assessment is sound.

IPP5 requires reasonable safeguards. The program cannot inspect your access controls, devices or hosting. IPP9 limits retention to what the lawful purpose requires; it does not set a universal number of days. The demo's review dates are fictional local reminders. The seven-day stale-project threshold in attention is a delivery policy, not a legal deadline.

Run `npm run onboarding -- compliance`. Record a review with `review-privacy --account=... --notice=... --retention=YYYY-MM-DD --security=YYYY-MM-DD --actor=...`. Review dates are next review dates. Due means strictly earlier than today. Retain supporting evidence privately outside Git.

The command does not delete personal data, contact individuals, enforce retention or prove legal compliance. Have the appropriate adviser review the obligations for your business. Keep exports and drafts under the same access and retention controls as the original records.
