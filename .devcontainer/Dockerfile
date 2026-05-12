FROM node:20-bookworm-slim

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

RUN groupadd -g 1001 sharedapps && usermod -aG sharedapps node

RUN mkdir -p /app/node_modules && chown -R node:node /app
WORKDIR /app
USER node
