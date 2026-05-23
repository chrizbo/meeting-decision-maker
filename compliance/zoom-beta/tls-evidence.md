# TLS Evidence

Date checked: 2026-05-23

Public service URL: `https://roomclarity.com`

## TLS 1.2 Check

Command:

```bash
curl -sS -I --tlsv1.2 https://roomclarity.com/
```

Result:

```text
HTTP/2 200
strict-transport-security: max-age=31536000; includeSubDomains
x-content-type-options: nosniff
content-security-policy: default-src 'self'; script-src 'self' https://appssdk.zoom.us; style-src 'self'; img-src 'self' data:; connect-src 'self'; frame-ancestors 'self' https://*.zoom.us https://*.zoom.com
referrer-policy: strict-origin-when-cross-origin
content-type: text/html; charset=utf-8
cache-control: no-store
server: Google Frontend
```

`curl` successfully connected with TLS 1.2 or higher and returned HTTP 200.

## Health Check

Command:

```bash
curl -sS https://roomclarity.com/api/healthz
```

Result:

```json
{"ok":true}
```
