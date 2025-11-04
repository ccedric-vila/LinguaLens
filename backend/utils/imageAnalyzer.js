// utils/imageAnalyzer.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

/**
 * Image Analysis Utilities
 */
class ImageAnalyzer {
  /**
   * Analyze image metadata and characteristics
   */
  async analyzeImage(imagePath) {
    try {
      const metadata = await sharp(imagePath).metadata();
      const stats = fs.statSync(imagePath);
      
      return {
        dimensions: {
          width: metadata.width,
          height: metadata.height,
          aspectRatio: (metadata.width / metadata.height).toFixed(2)
        },
        format: {
          format: metadata.format,
          space: metadata.space,
          channels: metadata.channels,
          depth: metadata.depth
        },
        size: {
          bytes: stats.size,
          megabytes: (stats.size / 1024 / 1024).toFixed(2)
        },
        hasAlpha: metadata.hasAlpha,
        isOpaque: !metadata.hasAlpha,
        orientation: metadata.orientation || 1
      };
    } catch (error) {
      throw new Error(`Image analysis failed: ${error.message}`);
    }
  }

  /**
   * Preprocess image for better OCR and object detection
   */
  async preprocessImage(imagePath, options = {}) {
    const {
      resize = true,
      enhanceContrast = true,
      sharpen = true,
      removeNoise = false,
      targetFormat = 'png'
    } = options;

    const outputPath = imagePath.replace(/\.[^/.]+$/, `_preprocessed.${targetFormat}`);
    
    try {
      let pipeline = sharp(imagePath);

      // Resize if too large (maintains aspect ratio)
      if (resize) {
        pipeline = pipeline.resize(2000, 2000, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Enhance contrast
      if (enhanceContrast) {
        pipeline = pipeline.normalize().linear(1.1, -(128 * 0.1));
      }

      // Sharpen image
      if (sharpen) {
        pipeline = pipeline.sharpen({ sigma: 1.0 });
      }

      // Convert to appropriate format
      if (targetFormat === 'jpeg') {
        pipeline = pipeline.jpeg({ quality: 90, mozjpeg: true });
      } else {
        pipeline = pipeline.png({ compressionLevel: 9, quality: 90 });
      }

      await pipeline.toFile(outputPath);

      return {
        success: true,
        processedPath: outputPath,
        originalSize: (await sharp(imagePath).metadata()).size,
        processedSize: (await sharp(outputPath).metadata()).size,
        format: targetFormat
      };

    } catch (error) {
      console.error('Image preprocessing failed:', error);
      return {
        success: false,
        error: error.message,
        processedPath: imagePath // Fallback to original
      };
    }
  }

  /**
   * Detect image quality factors that might affect OCR/object detection
   */
  async assessImageQuality(imagePath) {
    try {
      const analysis = await this.analyzeImage(imagePath);
      const issues = [];
      const suggestions = [];

      // Check resolution
      if (analysis.dimensions.width < 500 || analysis.dimensions.height < 500) {
        issues.push('low_resolution');
        suggestions.push('Use higher resolution image for better accuracy');
      }

      // Check file size (too small might be low quality)
      if (analysis.size.bytes < 10240) { // 10KB
        issues.push('very_small_file');
        suggestions.push('Image file might be too compressed');
      }

      // Check aspect ratio (very wide/tall images might be problematic)
      const aspectRatio = analysis.dimensions.aspectRatio;
      if (aspectRatio > 3 || aspectRatio < 0.33) {
        issues.push('extreme_aspect_ratio');
        suggestions.push('Consider cropping to more standard aspect ratio');
      }

      return {
        quality: issues.length === 0 ? 'good' : 'needs_improvement',
        issues: issues,
        suggestions: suggestions,
        score: this.calculateQualityScore(analysis, issues),
        analysis: analysis
      };

    } catch (error) {
      return {
        quality: 'unknown',
        issues: ['analysis_failed'],
        suggestions: ['Unable to analyze image quality'],
        score: 0,
        error: error.message
      };
    }
  }

  /**
   * Calculate quality score (0-100)
   */
  calculateQualityScore(analysis, issues) {
    let score = 100;

    // Deduct for issues
    if (issues.includes('low_resolution')) score -= 30;
    if (issues.includes('very_small_file')) score -= 20;
    if (issues.includes('extreme_aspect_ratio')) score -= 10;

    // Bonus for good characteristics
    if (analysis.dimensions.width >= 1000 && analysis.dimensions.height >= 1000) score += 10;
    if (analysis.size.megabytes > 0.5 && analysis.size.megabytes < 2) score += 5;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate multiple variants of image for different processing approaches
   */
  async generateProcessingVariants(imagePath) {
    const variants = [];
    const baseName = path.basename(imagePath, path.extname(imagePath));
    const variantsDir = path.join(path.dirname(imagePath), 'variants');
    
    // Create variants directory if it doesn't exist
    if (!fs.existsSync(variantsDir)) {
      fs.mkdirSync(variantsDir, { recursive: true });
    }

    try {
      // Variant 1: High contrast for text
      const highContrastPath = path.join(variantsDir, `${baseName}_contrast.png`);
      await sharp(imagePath)
        .greyscale()
        .normalize()
        .linear(1.3, -(128 * 0.3))
        .toFile(highContrastPath);
      variants.push({ type: 'high_contrast', path: highContrastPath });

      // Variant 2: Sharpened for clarity
      const sharpenedPath = path.join(variantsDir, `${baseName}_sharp.png`);
      await sharp(imagePath)
        .sharpen({ sigma: 1.2, m1: 1, m2: 3 })
        .toFile(sharpenedPath);
      variants.push({ type: 'sharpened', path: sharpenedPath });

      // Variant 3: Brightened for dark images
      const brightenedPath = path.join(variantsDir, `${baseName}_bright.png`);
      await sharp(imagePath)
        .linear(1.2, 0)
        .toFile(brightenedPath);
      variants.push({ type: 'brightened', path: brightenedPath });

      return {
        success: true,
        variants: variants,
        directory: variantsDir
      };

    } catch (error) {
      console.error('Variant generation failed:', error);
      return {
        success: false,
        error: error.message,
        variants: []
      };
    }
  }

  /**
   * Clean up temporary files and variants
   */
  async cleanupFiles(filePaths) {
    const results = [];
    
    for (const filePath of filePaths) {
      try {
        if (fs.existsSync(filePath) && !filePath.includes('upload_')) {
          fs.unlinkSync(filePath);
          results.push({ path: filePath, status: 'deleted' });
        }
      } catch (error) {
        results.push({ path: filePath, status: 'error', error: error.message });
      }
    }
    
    return results;
  }

  /**
   * Validate image file before processing
   */
  validateImageFile(filePath) {
    try {
      const stats = fs.statSync(filePath);
      
      if (stats.size === 0) {
        return { isValid: false, error: 'File is empty' };
      }
      
      if (!this.isImageFile(filePath)) {
        return { isValid: false, error: 'Not a valid image file' };
      }
      
      return { isValid: true, size: stats.size };
    } catch (error) {
      return { isValid: false, error: error.message };
    }
  }

  /**
   * Check if file is an image based on extension and magic numbers
   */
  isImageFile(filePath) {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
    const ext = path.extname(filePath).toLowerCase();
    
    return imageExtensions.includes(ext);
  }
}

module.exports = new ImageAnalyzer();