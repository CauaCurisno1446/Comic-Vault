
FROM node:22-bookworm-slim

WORKDIR /app

# Dependências necessárias para compilar o canvas
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    pkg-config \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./

RUN npm install -g npm@latest \
    && npm ci --no-audit --no-fund

COPY . .

EXPOSE 3001

CMD ["npm", "run", "dev"]
