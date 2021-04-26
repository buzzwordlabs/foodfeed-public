FROM node:12-alpine
RUN apk add --update \
    curl \
    && rm -rf /var/cache/apk/
COPY runprod.sh .
WORKDIR /app
COPY . .
RUN npm run build:prod