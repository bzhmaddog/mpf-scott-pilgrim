# syntax=docker/dockerfile:1

FROM nginx:stable-alpine3.19-perl AS nginx-base

COPY conf/default.conf /etc/nginx/

COPY ./conf/default.conf /etc/nginx/conf.d/default.conf
COPY ./includes/ /etc/nginx/includes/
