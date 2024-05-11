# syntax=docker/dockerfile:1

FROM alpine:latest

RUN apk --update \
    add lighttpd && \
    rm -rf /var/cache/apk/*

RUN mkdir -p /var/www
RUN mkdir -p /conf

WORKDIR /var/www

#COPY ./dist/ /var/www/
COPY ./conf/lighttpd.conf /conf/

COPY --chown=www-data:www-data . .

USER lighttpd

ENTRYPOINT ["lighttpd","-D","-f", "/conf/lighttpd.conf"]
#CMD /bin/sh