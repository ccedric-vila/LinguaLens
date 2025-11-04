# easyocr_runner.py - ENHANCED MULTILINGUAL SUPPORT
#!/usr/bin/env python3
import sys
import json
import easyocr
import cv2
import numpy as np
import os

def main(image_path, languages):
    try:
        # Initialize reader with MULTILINGUAL support
        lang_list = [lang.strip() for lang in languages.split(',')]
        
        # If no specific languages provided, use a comprehensive set
        if not lang_list or lang_list == ['']:
            lang_list = ['en', 'ja', 'ko', 'zh', 'bn', 'hi', 'ar', 'ru', 'fr', 'es', 'de']
        
        print(f"OCR Languages: {lang_list}", file=sys.stderr)
        
        reader = easyocr.Reader(lang_list, gpu=False, verbose=False)
        
        # Read and preprocess image
        img = cv2.imread(image_path)
        if img is None:
            print(json.dumps({"text": "", "confidence": 0}))
            return 1
        
        # Enhanced preprocessing for multilingual text
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Multiple preprocessing techniques for different script types
        processed_images = []
        
        # 1. Original grayscale
        processed_images.append(gray)
        
        # 2. Contrast enhanced
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(gray)
        processed_images.append(enhanced)
        
        # 3. Denoised
        denoised = cv2.fastNlMeansDenoising(gray)
        processed_images.append(denoised)
        
        # 4. Binary threshold
        _, binary = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        processed_images.append(binary)
        
        all_results = []
        
        # Try OCR on each preprocessed version
        for processed_img in processed_images:
            try:
                results = reader.readtext(
                    processed_img,
                    detail=1,
                    paragraph=False,  # Better for mixed scripts
                    text_threshold=0.3,  # Lower threshold for non-Latin scripts
                    low_text=0.2,
                    link_threshold=0.3,
                    slope_ths=0.3,
                    ycenter_ths=0.5,
                    height_ths=0.8,
                    width_ths=1.2,     # More tolerant for different scripts
                    decoder='beamsearch',
                    beamWidth=5,
                    batch_size=1,
                    allowlist=None,     # Allow all characters
                    blocklist=''        # No blocklist
                )
                all_results.extend(results)
            except Exception as e:
                print(f"OCR error on one preprocessing method: {e}", file=sys.stderr)
                continue
        
        if not all_results:
            # Fallback: try with individual language focus
            print("Trying fallback OCR...", file=sys.stderr)
            for lang in lang_list:
                try:
                    single_reader = easyocr.Reader([lang], gpu=False, verbose=False)
                    results = single_reader.readtext(
                        enhanced,
                        detail=1,
                        paragraph=False,
                        text_threshold=0.2,
                        low_text=0.1
                    )
                    all_results.extend(results)
                except:
                    continue
        
        # Process and merge results
        text_parts = []
        confidences = []
        
        # Remove duplicates and low-confidence results
        seen_texts = set()
        
        for bbox, text, confidence in all_results:
            text_clean = text.strip()
            if (text_clean and 
                confidence > 0.1 and  # Lower threshold for non-Latin
                text_clean not in seen_texts and
                len(text_clean) > 0):
                
                seen_texts.add(text_clean)
                text_parts.append(text_clean)
                confidences.append(confidence)
        
        # Sort by position (top to bottom, left to right)
        if all_results:
            try:
                # Get bounding boxes for sorting
                text_with_bbox = []
                for (bbox, text, confidence) in all_results:
                    if text.strip() and confidence > 0.1:
                        # Calculate center of bbox
                        center_y = np.mean(bbox[:, 1])
                        center_x = np.mean(bbox[:, 0])
                        text_with_bbox.append((center_y, center_x, text.strip(), confidence))
                
                # Sort by Y (top to bottom) then X (left to right)
                text_with_bbox.sort(key=lambda x: (x[0], x[1]))
                text_parts = [item[2] for item in text_with_bbox]
                confidences = [item[3] for item in text_with_bbox]
            except:
                pass  # Keep original order if sorting fails
        
        final_text = '\n'.join(text_parts) if len(text_parts) > 1 else ' '.join(text_parts)
        avg_confidence = (sum(confidences) / len(confidences) * 100) if confidences else 0
        
        output = {
            "text": final_text,
            "confidence": round(avg_confidence, 2),
            "languages_used": lang_list,
            "lines_found": len(text_parts)
        }
        
        print(f"Extracted text: {final_text}", file=sys.stderr)
        print(json.dumps(output, ensure_ascii=False))
        return 0
        
    except Exception as e:
        error_output = {
            "error": str(e),
            "text": "", 
            "confidence": 0,
            "languages_used": [],
            "lines_found": 0
        }
        print(json.dumps(error_output, ensure_ascii=False))
        return 1

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"error": "Usage: python easyocr_runner.py <image_path> <languages>"}))
        sys.exit(1)
    
    image_path = sys.argv[1]
    languages = sys.argv[2]
    sys.exit(main(image_path, languages))