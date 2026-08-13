# Use stable Python 3.12 Bookworm base image (Debian 12 - satisfies requirements for numpy >= 2.4.0)
FROM python:3.12-bookworm

# Install system dependencies (Tesseract OCR and OpenGL libraries for OpenCV)
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
