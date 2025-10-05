# Stage 1: Build dependencies in a temporary image
FROM python:3.9.19-slim AS builder

WORKDIR /app

# Install dependencies in the builder image
RUN pip3 install --upgrade pip setuptools \
    && pip3 install --prefix=/install --no-cache-dir pillow gunicorn mpf --pre Flask

# Stage 2: Final lightweight runtime image
FROM python:3.9.19-slim

WORKDIR /app

# Copy only the necessary files from the builder stage
COPY --from=builder /install /usr/local
COPY ./src/ ./

# Expose the application port
EXPOSE 5000

# Run the application with Gunicorn
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]