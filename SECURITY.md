# Security and privacy

DSH Token Monitor consumes only the standard `session.list` projection values
already exposed to the authenticated DSH Web client. It does not read prompt or
response text, DSH session files, credentials, environment variables, or API
keys. It exposes no Host HTTP route and executes no command.

Pricing, budget, and one aggregate snapshot per day are stored only in the
current browser's local storage. Token counts are provider-reported where the
active adapter supplies usage; missing projection data stays visibly
unmeasured. Cost is always a local estimate based on user-entered rates, never
a provider invoice.

Report vulnerabilities privately through GitHub Security Advisories. Do not
include credentials, prompts, session exports, or other user data in a report.
