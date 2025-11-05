// controllers/ObjectDetectionController.js - ENHANCED WITH FAST MODE
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

class ObjectDetectionController {
  constructor() {
    this.clarifaiApiKey = process.env.CLARIFAI_API_KEY;
    this.isConfigured = !!this.clarifaiApiKey && this.clarifaiApiKey.length > 30;
    console.log('🔧 Clarifai configured:', this.isConfigured);
    if (this.isConfigured) {
      console.log('✅ Clarifai API Key loaded successfully');
      console.log('🔑 API Key (first 8 chars):', this.clarifaiApiKey.substring(0, 8) + '...');
    } else {
      console.log('❌ Clarifai API Key not found or invalid');
    }
  }

  /**
   * MAIN DETECTION - Uses Clarifai for super accurate object detection
   */
  async detectObjects(imagePath, fastMode = false) {
    console.log('🎯 Starting object detection for:', path.basename(imagePath));
    
    if (fastMode) {
      return await this.fastObjectDetection(imagePath);
    }
    
    // Try Clarifai first (most accurate)
    if (this.isConfigured) {
      try {
        console.log('🔍 Using Clarifai AI...');
        const clarifaiResult = await this.detectWithClarifai(imagePath);
        if (clarifaiResult.success && clarifaiResult.objects.length > 0) {
          console.log(`✅ Clarifai detected ${clarifaiResult.objects.length} specific objects`);
          // Limit to top 4 immediately
          clarifaiResult.objects = clarifaiResult.objects.slice(0, 4);
          clarifaiResult.count = clarifaiResult.objects.length;
          return clarifaiResult;
        }
      } catch (error) {
        console.log('❌ Clarifai failed:', error.message);
      }
    }

    // Enhanced fallback
    console.log('🔄 Using enhanced analysis...');
    return this.enhancedObjectDetection(imagePath);
  }

  /**
   * Fast object detection for image-only content
   */
  async fastObjectDetection(imagePath) {
    console.log('⚡ Fast object detection for image-only content');
    
    try {
      // Only use Clarifai for speed
      if (this.isConfigured) {
        const clarifaiResult = await this.detectWithClarifai(imagePath);
        if (clarifaiResult.success && clarifaiResult.objects.length > 0) {
          // Limit to top 4 objects immediately
          clarifaiResult.objects = clarifaiResult.objects.slice(0, 4);
          clarifaiResult.count = clarifaiResult.objects.length;
          return clarifaiResult;
        }
      }
      
      // Quick fallback with basic analysis
      const quickResult = await this.quickColorAnalysis(imagePath);
      if (quickResult.objects.length > 0) {
        return {
          success: true,
          objects: quickResult.objects.slice(0, 4),
          description: quickResult.description,
          engine: 'fast_color_analysis',
          count: Math.min(quickResult.objects.length, 4)
        };
      }
      
      // Final fallback
      return this.basicFallbackDetection();
      
    } catch (error) {
      console.log('❌ Fast object detection failed:', error.message);
      return this.basicFallbackDetection();
    }
  }

  /**
   * Quick color analysis for fast mode
   */
  async quickColorAnalysis(imagePath) {
    try {
      const { data, info } = await sharp(imagePath)
        .resize(400, 400)
        .raw()
        .toBuffer({ resolveWithObject: true });

      const pixels = new Uint8Array(data);
      const totalPixels = pixels.length / 3;
      
      let greenPixels = 0, bluePixels = 0, brownPixels = 0;
      let skinPixels = 0, redPixels = 0, whitePixels = 0;

      for (let i = 0; i < pixels.length; i += 3) {
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];

        // Quick color detection
        if (g > r + 20 && g > b + 20) greenPixels++;
        if (b > r + 15 && b > g + 15) bluePixels++;
        if (r > 80 && g > 60 && b < 80) brownPixels++;
        if (r > 160 && g > 120 && b > 100 && r > g && g > b) skinPixels++;
        if (r > 180 && g < 120 && b < 120) redPixels++;
        if (r > 220 && g > 220 && b > 220) whitePixels++;
      }

      const objects = [];
      const greenRatio = greenPixels / totalPixels;
      const blueRatio = bluePixels / totalPixels;
      const skinRatio = skinPixels / totalPixels;

      // Quick object inference
      if (greenRatio > 0.3) {
        objects.push({ name: 'Nature', confidence: 0.8, boundingBox: [] });
        objects.push({ name: 'Plant', confidence: 0.7, boundingBox: [] });
      }
      
      if (blueRatio > 0.3) {
        objects.push({ name: 'Sky', confidence: 0.9, boundingBox: [] });
      }
      
      if (skinRatio > 0.15) {
        objects.push({ name: 'Person', confidence: 0.7, boundingBox: [] });
      }
      
      if (objects.length === 0) {
        objects.push({ name: 'Image Content', confidence: 0.6, boundingBox: [] });
      }

      return {
        objects: objects.slice(0, 4),
        description: this.generateQuickDescription(objects)
      };

    } catch (error) {
      console.warn('⚠️ Quick color analysis failed:', error.message);
      return { objects: [], description: 'Quick analysis failed' };
    }
  }

  /**
   * Generate quick description
   */
  generateQuickDescription(objects) {
    if (objects.length === 0) return 'Basic image content detected.';
    
    const names = objects.map(obj => obj.name);
    if (names.includes('Nature') && names.includes('Sky')) {
      return 'Outdoor scene with natural elements.';
    } else if (names.includes('Person')) {
      return 'Contains human subject.';
    } else {
      return `Contains: ${names.join(', ')}.`;
    }
  }

  /**
   * CLARIFAI DETECTION - FIXED API ENDPOINT
   */
  async detectWithClarifai(imagePath) {
    try {
      // Read and encode image
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');

      console.log('📤 Sending image to Clarifai...');
      console.log('📊 Image size:', (imageBuffer.length / 1024).toFixed(2), 'KB');
      
      // FIXED: Correct Clarifai API v2 endpoint structure
      const USER_ID = 'clarifai';
      const APP_ID = 'main';
      const MODEL_ID = 'general-image-recognition';
      const MODEL_VERSION_ID = 'aa7f35c01e0642fda5cf400f543e7c40';
      
      const API_URL = `https://api.clarifai.com/v2/models/${MODEL_ID}/versions/${MODEL_VERSION_ID}/outputs`;
      
      console.log('🌐 API Endpoint:', API_URL);

      // Clarifai API request with CORRECT format
      const response = await axios.post(
        API_URL,
        {
          user_app_id: {
            user_id: USER_ID,
            app_id: APP_ID
          },
          inputs: [
            {
              data: {
                image: {
                  base64: base64Image
                }
              }
            }
          ]
        },
        {
          headers: {
            'Authorization': `Key ${this.clarifaiApiKey}`,
            'Content-Type': 'application/json'
          },
          timeout: 10000 // Faster timeout
        }
      );

      console.log('📡 Clarifai Response Status:', response.status);

      // Extract concepts from response
      const concepts = response.data.outputs[0]?.data?.concepts || [];
      
      console.log(`📊 Clarifai raw concepts: ${concepts.length}`);
      if (concepts.length > 0) {
        console.log('🔝 Top 5 concepts:', concepts.slice(0, 5).map(c => `${c.name} (${(c.value * 100).toFixed(1)}%)`));
      }

      // Process and filter results
      const processedObjects = this.processClarifaiResults(concepts);
      
      if (processedObjects.length === 0) {
        throw new Error('No high-confidence objects detected by Clarifai');
      }

      const description = this.generateSpecificDescription(processedObjects);

      return {
        success: true,
        objects: processedObjects,
        description: description,
        engine: 'clarifai_ai',
        count: processedObjects.length,
        rawCount: concepts.length
      };

    } catch (error) {
      console.error('❌ Clarifai detection failed:', error.message);
      throw error;
    }
  }

  /**
   * Process Clarifai results into specific objects - LIMITED TO 4
   */
  processClarifaiResults(concepts) {
    const confidenceThreshold = 0.75; // 75% confidence threshold
    
    const filtered = concepts.filter(concept => concept.value >= confidenceThreshold);
    console.log(`🎯 Filtered to ${filtered.length} high-confidence objects (>${confidenceThreshold * 100}%)`);
    
    return filtered
      .map(concept => ({
        name: this.formatSpecificName(concept.name),
        confidence: concept.value,
        boundingBox: [],
        originalName: concept.name
      }))
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 4); // Only top 4 most confident results
  }

  /**
   * Format Clarifai names to be more readable and specific
   */
  formatSpecificName(clarifaiName) {
    const specificMappings = {
      // Animals
      'animal': 'Animal', 'dog': 'Dog', 'cat': 'Cat', 'bird': 'Bird', 
      'mammal': 'Mammal', 'pet': 'Pet', 'wildlife': 'Wildlife',
      'puppy': 'Puppy', 'kitten': 'Kitten',
      
      // Nature & Outdoor - PRIORITIZED
      'tree': 'Tree', 'plant': 'Plant', 'flower': 'Flower', 
      'grass': 'Grass', 'forest': 'Forest', 'nature': 'Nature',
      'outdoors': 'Outdoor Scene', 'sky': 'Sky', 'cloud': 'Cloud',
      'water': 'Water', 'ocean': 'Ocean', 'river': 'River',
      'mountain': 'Mountain', 'beach': 'Beach', 'leaf': 'Leaf',
      'wood': 'Wood', 'bark': 'Tree Bark', 'foliage': 'Foliage',
      'branch': 'Branch', 'trunk': 'Tree Trunk',
      
      // People - MORE SPECIFIC
      'person': 'Person', 'people': 'People', 'human': 'Human',
      'man': 'Man', 'woman': 'Woman', 'child': 'Child',
      'face': 'Face', 'portrait': 'Portrait', 'head': 'Head',
      'body': 'Human Body',
      
      // Transportation
      'car': 'Car', 'vehicle': 'Vehicle', 'automobile': 'Car',
      'truck': 'Truck', 'bus': 'Bus', 'motorcycle': 'Motorcycle',
      'bicycle': 'Bicycle', 'bike': 'Bicycle',
      
      // Food
      'food': 'Food', 'pizza': 'Pizza', 'hamburger': 'Hamburger',
      'sandwich': 'Sandwich', 'fruit': 'Fruit', 'vegetable': 'Vegetable',
      'apple': 'Apple', 'banana': 'Banana', 'orange': 'Orange',
      
      // Electronics
      'computer': 'Computer', 'laptop': 'Laptop', 'phone': 'Phone',
      'television': 'Television', 'camera': 'Camera',
      
      // Furniture
      'chair': 'Chair', 'table': 'Table', 'furniture': 'Furniture',
      'bed': 'Bed', 'sofa': 'Sofa', 'couch': 'Couch',
      
      // Buildings
      'building': 'Building', 'house': 'House', 'architecture': 'Building',
      'city': 'City', 'urban': 'Urban', 'street': 'Street'
    };

    const lowerName = clarifaiName.toLowerCase().trim();
    
    // Exact match
    if (specificMappings[lowerName]) {
      return specificMappings[lowerName];
    }
    
    // Partial match
    for (const [key, value] of Object.entries(specificMappings)) {
      if (lowerName.includes(key)) {
        return value;
      }
    }
    
    // Capitalize and return original
    return clarifaiName.charAt(0).toUpperCase() + clarifaiName.slice(1);
  }

  /**
   * ENHANCED OBJECT DETECTION - FIXED VERSION
   */
  async enhancedObjectDetection(imagePath) {
    try {
      console.log('🔍 Running enhanced analysis...');
      
      const results = await Promise.allSettled([
        this.enhancedColorAnalysis(imagePath),
        this.shapeAnalysis(imagePath),
        this.metadataAnalysis(imagePath)
      ]);

      let allObjects = [];
      
      results.forEach((result) => {
        if (result.status === 'fulfilled' && result.value.length > 0) {
          allObjects = allObjects.concat(result.value);
        }
      });

      const uniqueObjects = this.removeDuplicateObjects(allObjects);
      
      // Apply intelligent filtering and limit to 4
      const filteredObjects = this.applyIntelligentFiltering(uniqueObjects).slice(0, 4);
      
      console.log(`🎯 Enhanced analysis found ${filteredObjects.length} objects (limited to 4)`);

      return {
        success: true,
        objects: filteredObjects,
        description: this.generateSpecificDescription(filteredObjects),
        engine: 'enhanced_analysis',
        count: filteredObjects.length
      };

    } catch (error) {
      console.error('❌ Enhanced detection failed:', error.message);
      return this.basicFallbackDetection();
    }
  }

  /**
   * FIXED COLOR ANALYSIS - No more false person detection
   */
  async enhancedColorAnalysis(imagePath) {
    try {
      const { data, info } = await sharp(imagePath)
        .resize(400, 400)
        .raw()
        .toBuffer({ resolveWithObject: true });

      const pixels = new Uint8Array(data);
      const totalPixels = pixels.length / 3;
      
      let greenPixels = 0, bluePixels = 0, brownPixels = 0;
      let skinPixels = 0, redPixels = 0, whitePixels = 0;
      let darkPixels = 0, lightPixels = 0;

      for (let i = 0; i < pixels.length; i += 3) {
        const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
        const brightness = (r + g + b) / 3;

        // IMPROVED COLOR DETECTION
        if (g > r + 25 && g > b + 25 && g > 50) greenPixels++; // Strong green
        if (b > r + 20 && b > g + 20 && b > 50) bluePixels++; // Strong blue
        if (r > 80 && g > 60 && b < 80 && Math.abs(r - g) < 25) brownPixels++; // Better brown
        
        // MUCH STRICTER SKIN TONE DETECTION - Only detect obvious human skin
        const isSkinTone = (
          r > 160 && r < 245 &&
          g > 120 && g < 210 && 
          b > 100 && b < 190 &&
          Math.abs(r - g) < 50 &&
          Math.abs(g - b) < 50 &&
          r > g && g > b &&
          (r - g) > 10 && (g - b) > 10 // Clear gradient
        );
        if (isSkinTone) skinPixels++;
        
        if (r > 180 && g < 120 && b < 120) redPixels++;
        if (r > 220 && g > 220 && b > 220) whitePixels++;
        if (brightness < 50) darkPixels++;
        if (brightness > 200) lightPixels++;
      }

      const objects = [];
      const greenRatio = greenPixels / totalPixels;
      const brownRatio = brownPixels / totalPixels;
      const skinRatio = skinPixels / totalPixels;
      const blueRatio = bluePixels / totalPixels;

      console.log(`🎨 Color ratios - Green: ${(greenRatio*100).toFixed(1)}%, Brown: ${(brownRatio*100).toFixed(1)}%, Skin: ${(skinRatio*100).toFixed(1)}%`);

      // TREE DETECTION - Improved logic
      if (greenRatio > 0.2 && brownRatio > 0.05) {
        objects.push({ name: 'Tree', confidence: Math.min(0.85, 0.7 + greenRatio), boundingBox: [] });
        objects.push({ name: 'Nature', confidence: 0.8, boundingBox: [] });
        objects.push({ name: 'Foliage', confidence: 0.75, boundingBox: [] });
      } else if (greenRatio > 0.3) {
        objects.push({ name: 'Plant', confidence: 0.8, boundingBox: [] });
        objects.push({ name: 'Nature', confidence: 0.75, boundingBox: [] });
      }

      // SKY DETECTION
      if (blueRatio > 0.3) {
        objects.push({ name: 'Sky', confidence: 0.9, boundingBox: [] });
        if (whitePixels / totalPixels > 0.1) {
          objects.push({ name: 'Cloud', confidence: 0.7, boundingBox: [] });
        }
      }

      // PERSON DETECTION - MUCH STRICTER: Only if significant skin AND no strong nature signals
      const hasStrongNature = greenRatio > 0.25 || (greenRatio > 0.15 && brownRatio > 0.08);
      
      if (!hasStrongNature) {
        if (skinRatio > 0.20) { // Very high threshold
          objects.push({ name: 'Person', confidence: Math.min(0.8, 0.6 + skinRatio), boundingBox: [] });
        } else if (skinRatio > 0.12) { // Lower confidence for moderate skin tones
          objects.push({ name: 'Person', confidence: 0.55, boundingBox: [] });
        }
      }

      // LANDSCAPE DETECTION
      if (greenRatio > 0.4 || blueRatio > 0.4) {
        objects.push({ name: 'Landscape', confidence: 0.8, boundingBox: [] });
      }

      return objects;

    } catch (error) {
      console.warn('⚠️ Color analysis failed:', error.message);
      return [];
    }
  }

  /**
   * NEW: Shape-based analysis for better object differentiation
   */
  async shapeAnalysis(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      const objects = [];
      
      const aspectRatio = metadata.width / metadata.height;
      
      // Detect potential landscape vs portrait
      if (aspectRatio > 1.3) {
        objects.push({ name: 'Landscape', confidence: 0.7, boundingBox: [] });
      } else if (aspectRatio < 0.7) {
        objects.push({ name: 'Portrait', confidence: 0.6, boundingBox: [] });
      }
      
      // Large images might be scenery
      if (metadata.width > 1500 && metadata.height > 1500) {
        objects.push({ name: 'Detailed Scene', confidence: 0.6, boundingBox: [] });
      }
      
      return objects;
    } catch (error) {
      console.warn('⚠️ Shape analysis failed:', error.message);
      return [];
    }
  }

  /**
   * NEW: Intelligent filtering to remove false positives
   */
  applyIntelligentFiltering(objects) {
    const filtered = objects.filter(obj => obj.confidence > 0.5);
    
    // Remove conflicting detections
    const hasTree = filtered.some(obj => obj.name === 'Tree');
    const hasNature = filtered.some(obj => obj.name === 'Nature');
    const hasPerson = filtered.some(obj => obj.name === 'Person');
    
    // If we have high confidence nature/tree but low confidence person, remove person
    if ((hasTree || hasNature) && hasPerson) {
      const natureConfidence = Math.max(
        ...(filtered.filter(obj => obj.name === 'Tree' || obj.name === 'Nature').map(obj => obj.confidence))
      );
      const personConfidence = filtered.find(obj => obj.name === 'Person')?.confidence || 0;
      
      if (natureConfidence > personConfidence + 0.15) {
        console.log('🚫 Removing false person detection (nature scene detected)');
        return filtered.filter(obj => obj.name !== 'Person');
      }
    }
    
    return filtered;
  }

  /**
   * Metadata analysis
   */
  async metadataAnalysis(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      const objects = [];

      if (metadata.width > 2000 || metadata.height > 2000) {
        objects.push({ name: 'High Resolution Image', confidence: 0.6, boundingBox: [] });
      }

      return objects;

    } catch (error) {
      console.warn('⚠️ Metadata analysis failed:', error.message);
      return [];
    }
  }

  /**
   * Basic fallback
   */
  basicFallbackDetection() {
    const objects = [
      { name: 'Image Content', confidence: 0.5, boundingBox: [] },
      { name: 'Visual Data', confidence: 0.4, boundingBox: [] }
    ];

    return {
      success: true,
      objects: objects,
      description: 'Basic image content detected.',
      engine: 'basic_fallback',
      count: objects.length
    };
  }

  /**
   * Generate specific descriptions
   */
  generateSpecificDescription(objects) {
    if (!objects || objects.length === 0) {
      return 'No specific objects detected with high confidence.';
    }

    const highConfidence = objects.filter(obj => obj.confidence > 0.8);
    const mediumConfidence = objects.filter(obj => obj.confidence > 0.65 && obj.confidence <= 0.8);

    let description = '';

    if (highConfidence.length > 0) {
      const names = highConfidence.map(obj => obj.name);
      description += `Clear detection: ${names.join(', ')}.`;
    }

    if (mediumConfidence.length > 0) {
      const names = mediumConfidence.map(obj => obj.name);
      if (description) description += ' ';
      description += `Likely contains: ${names.join(', ')}.`;
    }

    // Add specific context for common scenarios
    if (objects.some(obj => obj.name === 'Tree') && objects.some(obj => obj.name === 'Sky')) {
      description += ' Appears to be an outdoor nature scene.';
    }

    return description || 'Objects detected with moderate confidence.';
  }

  /**
   * Remove duplicate objects
   */
  removeDuplicateObjects(objects) {
    const uniqueMap = new Map();
    objects.forEach(obj => {
      if (!uniqueMap.has(obj.name) || obj.confidence > uniqueMap.get(obj.name).confidence) {
        uniqueMap.set(obj.name, obj);
      }
    });
    return Array.from(uniqueMap.values());
  }
}

module.exports = new ObjectDetectionController();   