# Security Policy

## Reporting a Vulnerability

DripCatch handles sensitive personal financial records and takes security seriously. **Please do not report security vulnerabilities through public GitHub issues.**

If you discover a vulnerability—especially regarding Supabase Row Level Security (RLS), authentication, or split invitation tokens—please report it privately:

- **Email:** `security@dripcatch.fr`
- **Subject:** `[Security] Brief description of the issue`

Please include steps to reproduce the issue, affected routes or files, and any proof-of-concept details.

---

## Response Timeline

- **Initial Acknowledgment:** Within 48 hours of your report.
- **Status Update & Remediation Plan:** Within 5 business days.

---

## Scope & Architecture Notes

- DripCatch does not store bank credentials, OAuth banking tokens, or payment card data.
- All database tables enforce strict PostgreSQL Row Level Security (`auth.uid() = user_id`).
- Please avoid automated stress-testing or scraping against live production endpoints.
