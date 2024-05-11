# syntax=docker/dockerfile:1

#FROM python:3.11.9-bullseye
FROM python:3.9.19-bullseye

RUN pip3 install --upgrade pip
RUN pip3 install setuptools
RUN pip3 install --upgrade pillow
#RUN apt-get update && apt-get upgrade && apt-get install -y pip3

RUN pip3 install mpf[all]
RUN pip3 install mpf-mc
RUN pip3 install mpf-monitor
RUN pip3 install Flask

RUN mkdir -p /mpf
RUN mkdir -p /app

WORKDIR /app

COPY ./src/app.py ./


#CMD ["mpf", "-xt"]
#CMD ["tail", "-f", "/dev/null"]
CMD ["flask","--app", "app", "run", "--host=0.0.0.0"]


