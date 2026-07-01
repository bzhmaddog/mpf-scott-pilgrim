# syntax=docker/dockerfile:1
FROM python:3.9.19-slim

# Install pkill command (used in app.py)
RUN apt-get update && apt-get install -y libx11-6 libxext-dev libxrender-dev libxinerama-dev libxi-dev libxrendr-dev libxcursor-dev

# Upgrade pip
RUN pip3 install --upgrade pip
RUN pip3 install mpf-monitor --pre


# Run app
CMD ["/bin/sh"]

