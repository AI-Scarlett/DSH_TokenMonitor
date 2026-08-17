# Security and privacy

DSH Token Monitor registers one pure `sessionProjections` fold over durable
`request/header` routing metadata and provider-reported usage events. The Web
client consumes only that projection through the standard session list. It
does not read prompt or response text, DSH session files, credentials,
environment variables, or API keys. It exposes no Host HTTP route and executes
no command.

Token counts are provider-reported where the active adapter supplies usage;
missing projection data stays visibly unmeasured. No price, budget, account
usage, or browser-local usage snapshot is collected.

Report vulnerabilities privately through GitHub Security Advisories. Do not
include credentials, prompts, session exports, or other user data in a report.
