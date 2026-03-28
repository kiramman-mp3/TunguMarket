FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

# Exponemos el puerto del Metro Bundler de Expo
EXPOSE 8081

# Iniciamos expo (el host y configuración de LAN se pasarán por variables de entorno o compose)
CMD ["npx", "expo", "start", "--lan"]
