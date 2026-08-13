import os
import re
import cv2
import pytesseract
from flask import Flask, request, jsonify
from flask_cors import CORS
from utils.matcher import find_medicine, find_medicine_from_text

# Define Flask application
app = Flask(__name__)
# Enable CORS for frontend cross-origin requests
CORS(app)

# Ensure uploads directory exists relative to this file
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
UPLOAD_FOLDER = os.path.join(CURRENT_DIR, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

# Tesseract Path Configuration with fallback options
tesseract_paths = [
    r"C:\Users\priyanshu\AppData\Local\Programs\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files\Tesseract-OCR\tesseract.exe",
    r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
]
tesseract_configured = False
for path in tesseract_paths:
    if os.path.exists(path):
        pytesseract.pytesseract.tesseract_cmd = path
        tesseract_configured = True
        print(f"Tesseract OCR loaded successfully from: {path}")
        break

if not tesseract_configured:
    print("Warning: Tesseract executable not found in common default locations.")
    print("Will attempt to run using system PATH environment variable.")

def preprocess_and_ocr(filepath):
    """
    Reads an image and processes it with OpenCV to enhance OCR accuracy,
    then extracts text using Pytesseract.
    """
    img = cv2.imread(filepath)
    if img is None:
        raise ValueError("Could not read image file.")

    # 1. Primary raw OCR scan
    text = pytesseract.image_to_string(img)
    
    # 2. If OCR result is low quality or empty, apply image enhancement
    if len(text.strip()) < 5:
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # Apply bilateral filter to reduce noise while maintaining sharp edges
        denoised = cv2.bilateralFilter(gray, 9, 75, 75)
        # Apply Otsu's thresholding to binarize image
        thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)[1]
        text = pytesseract.image_to_string(thresh)
        
    return text

@app.route('/')
def home():
    return jsonify({
        "status": "online",
        "service": "Smart Medicine AI Backend API",
        "version": "1.1.0"
    })

@app.route('/search-text', methods=['POST'])
def search_text():
    data = request.json or {}
    name = data.get('name', '').strip()

    if not name:
        return jsonify({"success": False, "message": "Query string is empty"}), 400

    result = find_medicine(name)

    if result:
        return jsonify({
            "success": True,
            "query": name,
            "data": result
        })
    else:
        return jsonify({
            "success": False,
            "query": name,
            "message": f"Medicine '{name}' not found in database. Try another query."
        })

@app.route('/upload-image', methods=['POST'])
def upload_image():
    if 'image' not in request.files:
        return jsonify({"success": False, "message": "No file uploaded"}), 400

    file = request.files['image']

    if file.filename == '':
        return jsonify({"success": False, "message": "Empty filename"}), 400

    # Save file in absolute uploads path
    filepath = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(filepath)

    try:
        # Perform image preprocessing & OCR
        raw_text = preprocess_and_ocr(filepath)
        
        # Clean extracted text: remove special characters, lower-case, split and filter
        clean_text = re.sub(r'[^a-zA-Z\s]', ' ', raw_text.lower())
        words = clean_text.split()
        filtered_text = " ".join(words)

        # Call matcher with cleaned text instead of raw un-processed text
        result = find_medicine_from_text(filtered_text)

        if result:
            return jsonify({
                "success": True,
                "extracted_text": raw_text.strip(),
                "processed_text": filtered_text,
                "data": result
            })
        else:
            return jsonify({
                "success": False,
                "extracted_text": raw_text.strip(),
                "processed_text": filtered_text,
                "message": "Medicine package text scanned, but no matches found in database."
            })
            
    except Exception as e:
        return jsonify({
            "success": False,
            "message": f"Internal image processing failure: {str(e)}"
        }), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)