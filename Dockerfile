FROM node:20-slim AS builder

WORKDIR /app

COPY package.json bun.lock* ./
RUN npm install

COPY tsconfig.json ./
COPY src/ src/

RUN npx tsc

FROM node:20-slim

WORKDIR /app

COPY --from=builder /app/node_modules node_modules/
COPY --from=builder /app/dist dist/
COPY --from=builder /app/package.json ./

ENV MCP_MODE=mock
ENV NODE_ENV=production

CMD ["node", "dist/index.js"]
