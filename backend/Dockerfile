FROM node:20-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

EXPOSE 5000

# Iniciamos con nodemon para desarrollo
CMD ["npm", "run", "dev"]
