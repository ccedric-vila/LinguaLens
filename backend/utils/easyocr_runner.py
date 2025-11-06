# easyocr_runner.py - ULTRA ENHANCED FOR KOREAN/ASIAN SCRIPTS
#!/usr/bin/env python3
import sys
import json
import easyocr
import cv2
import numpy as np
import os

def is_asian_script(lang_list):
    """Check if we're processing Asian scripts that need special handling"""
    asian_langs = ['ko', 'kor', 'ja', 'jpn', 'zh', 'ch_sim', 'ch_tra', 'chi_sim', 'chi_tra']
    return any(lang in asian_langs for lang in lang_list)

def preprocess_for_korean_cjk(img):
    """Specialized preprocessing for Korean and CJK scripts"""
    processed_variants = []
    
    # Convert to grayscale
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # 1. High-resolution scaling for Korean (characters are complex)
    height, width = gray.shape
    scale_factor = 3  # Higher scaling for Korean
    scaled_high = cv2.resize(gray, (width * scale_factor, height * scale_factor), 
                           interpolation=cv2.INTER_CUBIC)
    processed_variants.append(('high_res', scaled_high))
    
    # 2. Gentle contrast enhancement for Korean
    clahe = cv2.createCLAHE(clipLimit=1.2, tileGridSize=(8, 8))  # Lower clip limit for Korean
    enhanced = clahe.apply(gray)
    processed_variants.append(('enhanced', enhanced))
    
    # 3. Bilateral filtering to preserve edges (important for Korean strokes)
    bilateral = cv2.bilateralFilter(gray, 9, 75, 75)
    processed_variants.append(('bilateral', bilateral))
    
    # 4. Morphological operations to connect broken Korean characters
    kernel = np.ones((2, 2), np.uint8)
    morphed = cv2.morphologyEx(gray, cv2.MORPH_CLOSE, kernel)
    processed_variants.append(('morphed', morphed))
    
    # 5. Original grayscale
    processed_variants.append(('original', gray))
    
    return processed_variants

def get_korean_optimized_params():
    """Parameters specifically optimized for Korean text"""
    return {
        'paragraph': False,
        'text_threshold': 0.1,  # Much lower threshold for Korean
        'low_text': 0.05,       # Very low for faint Korean text
        'link_threshold': 0.1,  # Lower for connected Korean characters
        'slope_ths': 0.05,      # Very tolerant of slanted text
        'ycenter_ths': 0.8,     # More vertical tolerance
        'height_ths': 1.5,      # Much more height variation tolerance
        'width_ths': 4.0,       # Much more width tolerance for Korean
        'decoder': 'beamsearch',
        'beamWidth': 20,        # Higher beam width for complex Korean
        'batch_size': 1,
        'allowlist': None,
        'blocklist': '',
        'min_size': 5,          # Smaller min size for Korean characters
        'contrast_ths': 0.1,    # Lower contrast threshold
        'adjust_contrast': 0.5   # Adjust contrast
    }

def main(image_path, languages):
    try:
        # Initialize reader with MULTILINGUAL support
        lang_list = [lang.strip() for lang in languages.split(',')]
        
        # If no specific languages provided, use a comprehensive set
        if not lang_list or lang_list == ['']:
            lang_list = ['ko', 'ja', 'zh', 'en']  # Korean first for priority
        
        print(f"OCR Languages: {lang_list}", file=sys.stderr)
        
        # Check if we need Korean/CJK optimization
        needs_korean_optimization = is_asian_script(lang_list)
        print(f"Korean/CJK optimization: {needs_korean_optimization}", file=sys.stderr)
        
        reader = easyocr.Reader(
            lang_list, 
            gpu=False, 
            verbose=False,
            model_storage_directory='./easyocr_models',
            download_enabled=True
        )
        
        # Read image
        img = cv2.imread(image_path)
        if img is None:
            print(json.dumps({"text": "", "confidence": 0, "error": "Could not read image"}))
            return 1
        
        # Choose preprocessing based on language
        if needs_korean_optimization:
            processed_images = preprocess_for_korean_cjk(img)
            ocr_params = get_korean_optimized_params()
        else:
            # Default preprocessing for other languages
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            processed_images = [('default', gray)]
            ocr_params = {
                'paragraph': False,
                'text_threshold': 0.3,
                'low_text': 0.2,
                'link_threshold': 0.3,
                'slope_ths': 0.3,
                'ycenter_ths': 0.5,
                'height_ths': 0.8,
                'width_ths': 1.2,
                'decoder': 'beamsearch',
                'beamWidth': 5,
                'batch_size': 1
            }
        
        print(f"Using {len(processed_images)} preprocessed variants", file=sys.stderr)
        print(f"OCR parameters: {ocr_params}", file=sys.stderr)
        
        all_results = []
        best_confidence = 0
        best_text = ""
        
        # Try OCR on each preprocessed version
        for variant_name, processed_img in processed_images:
            try:
                print(f"Processing {variant_name}...", file=sys.stderr)
                results = reader.readtext(processed_img, detail=1, **ocr_params)
                
                if results:
                    # Calculate average confidence for this variant
                    confidences = [confidence for (_, _, confidence) in results]
                    avg_confidence = sum(confidences) / len(confidences)
                    
                    print(f"✓ {variant_name}: {len(results)} elements, avg confidence: {avg_confidence:.2f}", file=sys.stderr)
                    
                    # Store results with variant info
                    for bbox, text, confidence in results:
                        all_results.append((bbox, text, confidence, variant_name))
                    
                    # Track best result
                    if avg_confidence > best_confidence:
                        best_confidence = avg_confidence
                        # Combine text from this variant
                        texts = [text for (_, text, _) in results]
                        best_text = ' '.join(texts)
                        
                else:
                    print(f"✗ {variant_name}: No text found", file=sys.stderr)
                    
            except Exception as e:
                print(f"OCR error on {variant_name}: {e}", file=sys.stderr)
                continue
        
        # If no good results with Korean optimization, try with super relaxed parameters
        if needs_korean_optimization and best_confidence < 0.3:
            print("Trying super relaxed parameters for Korean...", file=sys.stderr)
            super_relaxed = ocr_params.copy()
            super_relaxed.update({
                'text_threshold': 0.05,
                'low_text': 0.02,
                'link_threshold': 0.05,
                'slope_ths': 0.01,
                'height_ths': 2.0,
                'width_ths': 6.0
            })
            
            for variant_name, processed_img in processed_images[:2]:  # Try first two variants
                try:
                    results = reader.readtext(processed_img, detail=1, **super_relaxed)
                    if results:
                        confidences = [confidence for (_, _, confidence) in results]
                        avg_confidence = sum(confidences) / len(confidences)
                        
                        if avg_confidence > best_confidence:
                            best_confidence = avg_confidence
                            texts = [text for (_, text, _) in results]
                            best_text = ' '.join(texts)
                            print(f"✓ Super relaxed worked: confidence {avg_confidence:.2f}", file=sys.stderr)
                except:
                    continue
        
        # Process and sort final results
        if all_results:
            # Remove duplicates and low-confidence results
            seen_texts = set()
            unique_results = []
            
            for bbox, text, confidence, variant in all_results:
                text_clean = text.strip()
                min_confidence = 0.05 if needs_korean_optimization else 0.1
                
                if (text_clean and 
                    confidence > min_confidence and
                    text_clean not in seen_texts and
                    len(text_clean) > 0):
                    
                    seen_texts.add(text_clean)
                    unique_results.append((bbox, text_clean, confidence, variant))
            
            # Sort by position (top to bottom, left to right)
            try:
                text_with_pos = []
                for (bbox, text, confidence, variant) in unique_results:
                    center_y = np.mean(bbox[:, 1])
                    center_x = np.mean(bbox[:, 0])
                    text_with_pos.append((center_y, center_x, text, confidence, variant))
                
                text_with_pos.sort(key=lambda x: (x[0], x[1]))
                final_text_parts = [item[2] for item in text_with_pos]
                final_confidences = [item[3] for item in text_with_pos]
                
            except Exception as e:
                print(f"Sorting failed: {e}, using confidence order", file=sys.stderr)
                unique_results.sort(key=lambda x: x[2], reverse=True)  # Sort by confidence
                final_text_parts = [item[1] for item in unique_results]
                final_confidences = [item[2] for item in unique_results]
        else:
            final_text_parts = []
            final_confidences = []
        
        # Format final output
        if final_text_parts:
            # For Korean/CJK, prefer line breaks; for Latin, prefer spaces
            if needs_korean_optimization:
                final_text = '\n'.join(final_text_parts)
            else:
                final_text = ' '.join(final_text_parts)
            
            avg_confidence = (sum(final_confidences) / len(final_confidences) * 100) if final_confidences else 0
        else:
            final_text = best_text if best_text else ""
            avg_confidence = best_confidence * 100
        
        output = {
            "text": final_text,
            "confidence": round(avg_confidence, 2),
            "languages_used": lang_list,
            "lines_found": len(final_text_parts),
            "korean_optimized": needs_korean_optimization,
            "success": len(final_text_parts) > 0 or bool(best_text)
        }
        
        print(f"Final result: {len(final_text_parts)} lines, confidence: {avg_confidence:.1f}%", file=sys.stderr)
        if final_text:
            print(f"Extracted text: {final_text}", file=sys.stderr)
        
        print(json.dumps(output, ensure_ascii=False))
        return 0
        
    except Exception as e:
        error_output = {
            "error": str(e),
            "text": "", 
            "confidence": 0,
            "languages_used": [],
            "lines_found": 0,
            "success": False
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