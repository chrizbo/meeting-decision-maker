# Scan Results

Date checked: 2026-05-23

Final successful GitHub Actions run: `26339140824`

Run URL: `https://github.com/chrizbo/meeting-decision-maker/actions/runs/26339140824`

## Dependency Audit

Command:

```bash
npm audit --omit=dev --json
```

Result:

```json
{
  "auditReportVersion": 2,
  "vulnerabilities": {},
  "metadata": {
    "vulnerabilities": {
      "info": 0,
      "low": 0,
      "moderate": 0,
      "high": 0,
      "critical": 0,
      "total": 0
    },
    "dependencies": {
      "prod": 156,
      "dev": 0,
      "optional": 1,
      "peer": 0,
      "peerOptional": 0,
      "total": 156
    }
  }
}
```

Artifact: `artifacts/run-26339140824/npm-audit-results/npm-audit-results.json`

## Production Dependency Inventory

Command:

```bash
npm ls --omit=dev --depth=0
```

Result:

```text
meeting-decision-maker@0.1.0
├── @google-cloud/firestore@8.6.0
└── @zoom/rtms@1.1.0
```

## Functional Eval Evidence

Command:

```bash
npm run eval
```

Result summary:

```text
all cases
  expected: 33
  actual:   33
  matched:  33
  precision 100% · recall 100% · f1 100%
```

## SAST

Status: completed.

The repository includes `.github/workflows/security-scans.yml`, which runs CodeQL SAST on pull requests, pushes to `main`, weekly schedule, and manual dispatch.

Final result from GitHub Actions run `26339140824`:

```text
CodeQL SAST: success
SARIF results: 0
```

Artifact: `artifacts/run-26339140824/codeql-sast-results/javascript.sarif`

Note: an earlier run found a reflected exception-text issue in API error responses. The app was patched to return fixed public error messages, and the final CodeQL run completed with zero results.


## DAST

Status: completed.

The repository includes `.github/workflows/security-scans.yml`, which runs an OWASP ZAP baseline scan on manual workflow dispatch. The final scan used `https://roomclarity.com` as the `dast_target` input.

Final result from GitHub Actions run `26339140824`:

```text
OWASP ZAP DAST baseline: success
High alerts: 0
Medium alerts: 2
Low alerts: 5
Informational alerts: 4
```

Artifacts:

- `artifacts/run-26339140824/zap-baseline-results/report_html.html`
- `artifacts/run-26339140824/zap-baseline-results/report_md.md`
- `artifacts/run-26339140824/zap-baseline-results/report_json.json`

The medium findings are hardening warnings for CSP fallback directives and SRI on the Zoom Apps SDK script. These should be reviewed for compatibility with the Zoom Apps SDK before broad marketplace publication.
