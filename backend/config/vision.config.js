// config/vision.config.js
const path = require('path');

/**
 * Vision API Configuration
 */
const visionConfig = {
  // Google Cloud Vision Settings
  google: {
    enabled: process.env.GOOGLE_VISION_ENABLED !== 'false',
    credentials: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    projectId: process.env.GOOGLE_CLOUD_PROJECT,
    
    // Detection settings
    maxResults: 20,
    confidenceThreshold: 0.5, // 50% minimum confidence
    
    // Image processing
    maxImageSize: 4 * 1024 * 1024, // 4MB
    supportedFormats: ['image/jpeg', 'image/png', 'image/gif', 'image/bmp'],
    
    // Timeout settings (ms)
    timeout: 30000,
    maxRetries: 3
  },

  // Fallback settings
  fallback: {
    enabled: true,
    useLocalModels: false, // Set to true if you want to use local TensorFlow.js models
    localModelPath: path.join(__dirname, '..', 'models')
  },

  // Feature flags
  features: {
    objectDetection: true,
    labelDetection: false, // You can enable this for additional context
    textDetection: false,  // Already handled by OCR
    safeSearch: false,     // Content moderation
    webDetection: false    // Web context for images
  },

  // Performance settings
  performance: {
    batchSize: 1,
    concurrentRequests: 1,
    cacheResults: true,
    cacheDuration: 3600000 // 1 hour in milliseconds
  },

  // Response formatting
  response: {
    includeBoundingBoxes: true,
    includeConfidence: true,
    includeMidpoints: true,
    maxDescriptionLength: 500,
    formatObjectNames: true
  }
};

/**
 * Validate configuration
 */
visionConfig.validate = function() {
  const errors = [];
  
  if (this.google.enabled) {
    if (!this.google.credentials && !this.google.projectId) {
      errors.push('Google Cloud Vision enabled but no credentials or project ID provided');
    }
    
    if (this.google.confidenceThreshold < 0 || this.google.confidenceThreshold > 1) {
      errors.push('Confidence threshold must be between 0 and 1');
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors: errors
  };
};

/**
 * Get configuration for specific feature
 */
visionConfig.getFeatureConfig = function(feature) {
  const featureConfigs = {
    objectDetection: {
      maxResults: this.google.maxResults,
      confidenceThreshold: this.google.confidenceThreshold
    },
    labelDetection: {
      maxResults: 10,
      confidenceThreshold: 0.7
    }
  };
  
  return featureConfigs[feature] || {};
};

/**
 * Check if image format is supported
 */
visionConfig.isFormatSupported = function(mimeType) {
  return this.google.supportedFormats.includes(mimeType.toLowerCase());
};

/**
 * Get optimized image settings
 */
visionConfig.getImageOptimizationSettings = function() {
  return {
    maxWidth: 2000,
    maxHeight: 2000,
    quality: 90,
    format: 'jpeg'
  };
};

module.exports = visionConfig;