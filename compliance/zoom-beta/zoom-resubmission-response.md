# Zoom Beta Resubmission Response

Draft to send after the CodeQL SAST and OWASP ZAP DAST artifacts are attached.

Thank you for the review notes. We would like to proceed with Beta and are resubmitting the Technical Design section with additional supporting evidence.

We have attached evidence for the required items:

- SSDLC documentation.
- SAST scan results from CodeQL.
- DAST scan results from OWASP ZAP baseline.
- Privacy Policy at `https://roomclarity.com/privacy.html`.
- TLS 1.2+ verification.

We have also included the following additional security documents:

- Security policy.
- Incident management and response policy.
- Vulnerability management procedures.
- Infrastructure and dependency management policy.

The application is served at `https://roomclarity.com` and supports TLS 1.2 or higher. The service uses HSTS, a restrictive Content Security Policy, `nosniff`, and referrer policy headers. Zoom webhook events are verified using HMAC signatures and timestamp freshness checks. Meeting dashboard access uses scoped access tokens, and service-admin inspection routes require an admin token.

Please let us know if you need any additional supporting evidence for the Beta review.
