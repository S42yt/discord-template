FROM node:20.18.0

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    pkg-config \
 && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm install --force
RUN npm install -g typescript

COPY .docker.env .env

COPY . .

RUN npm run build

CMD ["npm", "run", "prod"]