# Scan Results

Date checked: 2026-05-23

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

Status: required before Zoom Beta resubmission.

The repository now includes `.github/workflows/security-scans.yml`, which runs CodeQL SAST on pull requests, pushes to `main`, weekly schedule, and manual dispatch.

Recommended command if using GitHub CodeQL in CI:

```bash
gh run list --workflow security-scans.yml --limit 5
gh run view <RUN_ID> --log
```

Recommended command if using Semgrep locally:

```bash
semgrep scan --config p/owasp-top-ten --config p/javascript --json --output compliance/zoom-beta/semgrep-results.json
```

Attach the exported CodeQL or Semgrep report to the Zoom Technical Design evidence.

## DAST

Status: required before Zoom Beta resubmission.

The repository now includes `.github/workflows/security-scans.yml`, which runs an OWASP ZAP baseline scan on manual workflow dispatch. Use `https://roomclarity.com` as the `dast_target` input.

Recommended command if using OWASP ZAP Baseline:

```bash
docker run --rm -t ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t https://roomclarity.com -J zap-results.json -r zap-report.html
```

Attach the generated `zap-results.json` or `zap-report.html` to the Zoom Technical Design evidence.
