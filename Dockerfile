FROM node:24-trixie-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN apt-get update && apt-get install -y --no-install-recommends ca-certificates && rm -rf /var/lib/apt/lists/* && npm ci --omit=dev && mkdir -p /app/logs

COPY server.js ./
COPY *.html *.png styles.css app.js zoom-launch.js ./
COPY fixtures ./fixtures
COPY evals ./evals
COPY sample-transcripts ./sample-transcripts
COPY schemas ./schemas
COPY skills ./skills

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server.js"]
