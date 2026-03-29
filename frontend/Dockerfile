# Etapa 1: Build do React
FROM node:20-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=/api
ARG VITE_MEDIA_URL=/media

ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
ENV VITE_MEDIA_URL=$VITE_MEDIA_URL

RUN npm run build

# Etapa 2: Nginx serve os arquivos estaticos
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
