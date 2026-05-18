FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY server.js ./
COPY index.html styles.css app.js ./
COPY fixtures ./fixtures
COPY sample-transcripts ./sample-transcripts
COPY schemas ./schemas
COPY skills ./skills

ENV NODE_ENV=production
ENV PORT=8080

EXPOSE 8080

CMD ["node", "server.js"]
