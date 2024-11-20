# syntax=docker/dockerfile:1
FROM python:3.9.19-slim

# Install pkill command (used in app.py)
RUN apt-get update && apt-get install -y procps

RUN apt-get install -y libglib2.0 libegl1 libegl-mesa0 libegl-dev
#libx11-6 libxext-dev libxinerama-dev libxi-dev libxrendr


# Upgrade pip
RUN pip3 install --upgrade pip

# Prepare dependencies list
COPY ./requirements.txt /

# Install dependencies
RUN pip3 install -r requirements.txt

# Create working directory
RUN mkdir -p /app

# Switch to the created directory
WORKDIR /app

# Copy main app script
COPY ./src/app.py ./

# Create mpf config directory
RUN mkdir -p /mpf

# Run app
CMD ["python","app.py"]


