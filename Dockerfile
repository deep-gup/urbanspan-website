# Multi-stage Dockerfile for UrbanSpan Customer Portal website
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

ARG CACHEBUST=20260828_01
RUN echo "Cache bust: $CACHEBUST"

COPY . .
RUN npm run build

# Nginx web server stage
FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY --from=builder /app/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
