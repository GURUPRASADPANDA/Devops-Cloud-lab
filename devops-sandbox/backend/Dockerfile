FROM node:20-alpine

WORKDIR /app

RUN apk add --no-cache curl docker-cli

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY src/ ./src/

EXPOSE 3001

HEALTHCHECK --interval=15s --timeout=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

CMD ["node", "src/index.js"]
