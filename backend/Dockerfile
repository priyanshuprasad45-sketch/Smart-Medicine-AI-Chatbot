# Use stable Python 3.10 Bookworm base image (Debian 12 - resolves Debian 11 mirror obsolescence errors)
FROM python:3.10-bookworm

# Install system dependencies (Tesseract OCR and OpenGL libraries for OpenCV)
# Combined apt-get clean, update, and install in a single RUN instruction to prevent caching errors.
RUN apt-get clean && \
    apt-get update --allow-releaseinfo-change -y && \
    apt-get install -y --no-install-recommends \
    tesseract-ocr \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory inside container
WORKDIR /app

# Copy and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install --no-cache-dir gunicorn

# Copy backend application code
COPY . .

# Expose port 5000 for Flask
EXPOSE 5000

# Run using Gunicorn production server
CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
