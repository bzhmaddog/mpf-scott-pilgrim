# syntax=docker/dockerfile:1

FROM nginx:stable-alpine3.19-perl as nginx-base

#EXPOSE 80 443 8443

COPY conf/default.conf /etc/nginx/

COPY ./conf/default.conf /etc/nginx/conf.d/default.conf
COPY ./404.html /var/www/html/404.html
COPY ./includes/ /etc/nginx/includes/


#CMD /bin/sh