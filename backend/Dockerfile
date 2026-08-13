# Use stable Python base image (Debian-based)
FROM python:3.10

# Install system dependencies (Tesseract OCR and OpenGL libraries for OpenCV)
# Uses a retry loop to be resilient against transient network/mirror failures on cloud build platforms like Render.
RUN apt-get clean && \
    (apt-get update --fix-missing || (sleep 5 && apt-get update --fix-missing) || (sleep 10 && apt-get update --fix-missing)) && \
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
