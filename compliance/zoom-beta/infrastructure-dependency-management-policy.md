# Infrastructure and Dependency Management Policy

## Runtime Infrastructure

Room Clarity is deployed as a Node.js service on Google Cloud Run behind HTTPS. The public production hostname is `https://roomclarity.com`.

## Runtime Configuration

Production configuration is provided through environment variables and managed secrets. Required values include:

- `ZOOM_CLIENT_ID`
- `ZOOM_CLIENT_SECRET`
- `ZOOM_REDIRECT_URI`
- `ZOOM_WEBHOOK_SECRET_TOKEN`
- `GEMINI_API_KEY` or `OPENAI_API_KEY`, depending on enabled model provider
- `PUBLIC_BASE_URL=https://roomclarity.com`
- `ROOM_CLARITY_ADMIN_TOKEN`
- `SESSION_STORE=firestore` when persistent session storage is enabled

Secrets must not be committed to source control.

## Dependency Management

- Production dependencies are defined in `package.json` and locked in `package-lock.json`.
- Production installs use `npm ci --omit=dev` in the Docker build.
- Dependency audit evidence is collected with `npm audit --omit=dev --json`.
- Dependency changes should be reviewed for package reputation, maintenance status, license suitability, and transitive vulnerability impact.

## Container Management

- The production image uses an official Node slim base image.
- The Docker build installs only production dependencies.
- The container exposes the Cloud Run port and starts `server.js`.
- Base image updates should be reviewed before beta expansion and marketplace publication.

## Third-Party Services

Current service dependencies include:

- Zoom APIs, Zoom Apps SDK, and RTMS.
- Google Cloud Run.
- Google Firestore when persistent session storage is enabled.
- Gemini API or OpenAI API for model-backed analysis, depending on configuration.

## Change Review

Infrastructure or dependency changes that affect credentials, transcript handling, webhook handling, OAuth, storage, logging, or model providers require security review before external beta release.
