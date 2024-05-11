# syntax=docker/dockerfile:1

FROM node:current-alpine3.19

RUN mkdir -p /app

WORKDIR /app

USER node

CMD ["sh", "-c", "npm install && npm run docker"]
#CMD ["/bin/sh"]