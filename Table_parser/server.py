import cv2
import numpy as np
import os
import re
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
import main

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3001"}})

IMAGES_DIR = "/Users/chromeblood/audit_checker/audit_checker/Agents/data/bmr-batch-1"

def main(n_tables, pages_no):
    try:
        page_int = int(pages_no)
        target_filename = f"BMR_batch_1_page-{page_int:04d}.jpg"
    except ValueError:
        target_filename = str(pages_no)

    image_path = os.path.join(IMAGES_DIR, target_filename)
    
    if not os.path.exists(image_path):
        return {"error": f"Image not found at {image_path}"}, 404

    # Isolation Fix: Use page number in the folder name
    page_label = f"page_{pages_no}"
    output_base = os.path.join(IMAGES_DIR, page_label)
    os.makedirs(output_base, exist_ok=True)

    json_path = os.path.join(output_base, "structure.json")

    try:
      
        main.extract_to_json(
            image_path=image_path,
            json_path=json_path,
            n_tables=int(n_tables)
        )

 
        main.crop_from_json(
            json_path=json_path,
            output_dir=output_base,
            image_path=image_path
        )

       
        if os.path.exists(json_path):
            with open(json_path, 'r') as f:
                structure_data = json.load(f)
        else:
            structure_data = None

        return {
            "status": "success",
            "processed_image": target_filename,
            "output_directory": output_base,
            "json_structure": json_path,
            "structure": structure_data
        }, 200

    except Exception as e:
        return {"status": "error", "message": str(e)}, 500



@app.route('/process', methods=['GET', 'POST'])
def process():
    if request.method == 'POST':
        data = request.json or {}
        n_tables = data.get('n_tables', 2)
        pages_no = data.get('pages_no')
    else:
        n_tables = request.args.get('n_tables', 2)
        pages_no = request.args.get('pages_no')

    if not pages_no:
        return jsonify({"error": "pages_no is required"}), 400

    result, status_code = main(n_tables, pages_no)
    return jsonify(result), status_code

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=3002)
