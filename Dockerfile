FROM node:alpine
WORKDIR /app

#LAS IMAGENES DE DOCKER FUNCIONA POR CAPAS,
#CADA COMANDO ES UNA CAPA!!!!
# Copiar el proyecto a la imagen de Docker
COPY package.json package-lock.json* ./
# Instalar las dependencias con npm i
RUN npm install
# Copiamos el resto proyecto
COPY . .
# Compilar el proyecto
RUN npm run build
EXPOSE 3000
# Colocar un comando de inicio
CMD ["node","dist/main"]