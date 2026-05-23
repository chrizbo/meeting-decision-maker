# Zoom Beta Security Evidence Packet

Prepared for the Room Clarity Zoom Beta resubmission.

## Submission Status

| Requirement | Evidence | Status |
| --- | --- | --- |
| SSDLC | `ssdlc.md` | Ready |
| SAST scan results | `scan-results.md`; `artifacts/run-26339140824/codeql-sast-results/javascript.sarif` | Ready |
| DAST scan results | `scan-results.md`; `artifacts/run-26339140824/zap-baseline-results/report_html.html` | Ready |
| Privacy Policy | `../../privacy.html` | Ready |
| TLS 1.2 or higher | `tls-evidence.md` | Ready |
| Security policy | `security-policy.md` | Ready |
| Incident management and response policy | `incident-response-policy.md` | Ready |
| Vulnerability management procedures | `vulnerability-management-procedures.md` | Ready |
| Infrastructure/dependency management policy | `infrastructure-dependency-management-policy.md` | Ready |

Zoom requires the first four evidence items and any three of the policy/procedure items. This packet includes four optional policy/procedure documents so the resubmission has margin.

## Recommended Technical Design Evidence Summary

Use the following summary in the Zoom Technical Design section and attach or link the files in this folder.

Room Clarity follows a documented secure development lifecycle for beta changes, including scoped requirements, code review, dependency review, security checks, test execution, release verification, and incident response. The application is a Node.js service deployed on Google Cloud Run behind HTTPS at `https://roomclarity.com`. It uses HSTS, a restrictive Content Security Policy, `nosniff`, and strict referrer policy headers. Zoom webhook events are verified with HMAC signatures and timestamp freshness checks. Meeting dashboard access uses scoped access tokens, and service-admin inspection routes require an admin token.

Supporting evidence:

- SSDLC: `compliance/zoom-beta/ssdlc.md`
- Privacy Policy: `privacy.html` at `https://roomclarity.com/privacy.html`
- Scan results: `compliance/zoom-beta/scan-results.md`
- TLS evidence: `compliance/zoom-beta/tls-evidence.md`
- Optional policy evidence: security, incident response, vulnerability management, and infrastructure/dependency management policies in this folder.

## Remaining Before Resubmission

1. Attach the final successful workflow run artifacts from `artifacts/run-26339140824/`.
2. Convert or upload these Markdown files as PDFs/screenshots if Zoom's submission form does not accept repository links.
3. Optional before marketplace publication: address the non-blocking ZAP hardening warnings for CSP fallback directives, permissions policy, cross-origin isolation headers, and SRI where compatible with the Zoom Apps SDK.
