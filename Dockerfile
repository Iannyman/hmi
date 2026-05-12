FROM node:20-bookworm-slim

# Install dependencies for native addons (node-opcua)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /app && chown node:node /app
WORKDIR /app

COPY --chown=node:node package.json package-lock.json* ./
USER node
RUN npm install

COPY --chown=node:node . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
