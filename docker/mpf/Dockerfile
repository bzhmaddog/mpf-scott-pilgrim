# syntax=docker/dockerfile:1

FROM python:3.9.19-slim
#FROM python:3.9.19-alpine3.20

RUN pip3 install --upgrade pip
RUN pip3 install setuptools
RUN pip3 install --upgrade pillow

RUN pip3 install mpf --pre
#RUN pip3 install mpf-mc
#RUN pip3 install mpf-monitor
RUN pip3 install Flask
#RUN pip3 install pyserial

#RUN apk add unzip

RUN mkdir -p /mpf
RUN mkdir -p /app
RUN mkdir -p /opp

#WORKDIR /opp

#COPY ./tools/open-pinball-project-code-r303-trunk.zip ./
#RUN unzip open-pinball-project-code-r303-trunk.zip

WORKDIR /app

COPY ./src/app.py ./



#CMD ["mpf", "-xt"]
#CMD ["tail", "-f", "/dev/null"]
CMD ["flask","--app", "app", "run", "--host=0.0.0.0"]


