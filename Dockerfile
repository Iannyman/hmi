FROM node:20-bookworm-slim

# Install dependencies for native addons (node-opcua)
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN chown -R node:node /app
USER node

EXPOSE 3000
CMD ["npm", "run", "dev"]
