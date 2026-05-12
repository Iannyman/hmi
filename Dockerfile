FROM node:20-bookworm-slim

# Install dependencies for native addons (node-opcua)
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps

COPY . .

EXPOSE 3000
CMD ["npm", "run", "dev"]
