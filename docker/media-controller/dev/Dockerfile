# syntax=docker/dockerfile:1

FROM node:22-alpine

RUN mkdir -p /app

WORKDIR /app

USER node

CMD ["sh", "-c", "npm install && npm run docker"]
#CMD ["/bin/sh"]