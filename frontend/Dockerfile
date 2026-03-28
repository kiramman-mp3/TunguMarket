FROM node:20-alpine

WORKDIR /app

# Copiamos solo los archivos de dependencias para aprovechar la caché de Docker
COPY package*.json ./

RUN npm install

# Exponemos el puerto de Vite
EXPOSE 5173

# El comando de inicio levanta Vite escuchando en todas las interfaces de red (--host)
CMD ["npm", "run", "dev", "--", "--host"]
