FROM node:20-alpine AS web-build
WORKDIR /app
COPY apps/web/package.json ./
RUN npm install
COPY apps/web/ ./
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=web-build /app/dist /usr/share/nginx/html
COPY infra/nginx/nginx.conf /etc/nginx/conf.d/default.conf
