import os
import pandas as pd
from rapidfuzz import process, fuzz

# Resolve absolute path to the CSV database so it loads correctly 
# regardless of which directory the Flask app is started from.
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_PATH = os.path.join(CURRENT_DIR, '..', 'data', 'medicines.csv')

try:
    data = pd.read_csv(CSV_PATH)
except Exception as e:
    print(f"Error loading medicines database from {CSV_PATH}: {e}")
    # Fallback mock data in case file is missing
    data = pd.DataFrame(columns=['name', 'uses', 'side_effects', 'dosage', 'precautions'])

def find_medicine(name):
    """
    Finds a medicine by name using direct fuzzy string matching.
    Designed for search bar queries.
    """
    if not name or data.empty:
        return None
    
    names = data['name'].tolist()
    match = process.extractOne(name.lower().strip(), names)

    # Require high similarity (>70%) for direct search queries
    if match and match[1] > 70:
        result = data[data['name'] == match[0]].iloc[0].to_dict()
        result['confidence'] = round(float(match[1]), 1)
        return result

    return None

def find_medicine_from_text(text):
    """
    Finds a medicine inside a large text block (like OCR output)
    using partial ratio similarity matching.
    """
    if not text or data.empty:
        return None
        
    names = data['name'].tolist()

    # Use fuzz.partial_ratio for scanning unstructured text
    match = process.extractOne(
        text.lower().strip(),
        names,
        scorer=fuzz.partial_ratio
    )

    # Lower threshold (>50%) to tolerate OCR misread characters and noise
    if match and match[1] > 50:
        result = data[data['name'] == match[0]].iloc[0].to_dict()
        result['confidence'] = round(float(match[1]), 1)
        return result

    return None