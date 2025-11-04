// middlewares/visionAuth.js
const visionConfig = require('../config/vision.config');

/**
 * Middleware to validate Vision API availability
 */
const validateVisionAPI = (req, res, next) => {
  const objectDetection = require('../controllers/ObjectDetectionController');
  
  if (!objectDetection.isConfigured && visionConfig.google.enabled) {
    return res.status(503).json({
      success: false,
      error: 'Object detection service is currently unavailable',
      details: 'Google Cloud Vision is not properly configured',
      code: 'VISION_SERVICE_UNAVAILABLE'
    });
  }
  
  next();
};

/**
 * Middleware to check image requirements for object detection
 */
const validateImageForDetection = (req, res, next) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No image file provided',
      code: 'MISSING_IMAGE'
    });
  }

  // Check file size
  const maxSize = visionConfig.google.maxImageSize;
  if (req.file.size > maxSize) {
    return res.status(413).json({
      success: false,
      error: `Image file too large. Maximum size is ${maxSize / 1024 / 1024}MB`,
      code: 'FILE_TOO_LARGE'
    });
  }

  // Check file format
  if (!visionConfig.isFormatSupported(req.file.mimetype)) {
    return res.status(415).json({
      success: false,
      error: `Unsupported image format: ${req.file.mimetype}`,
      supportedFormats: visionConfig.google.supportedFormats,
      code: 'UNSUPPORTED_FORMAT'
    });
  }

  next();
};

/**
 * Middleware to add vision capabilities to response
 */
const addVisionCapabilities = (req, res, next) => {
  const objectDetection = require('../controllers/ObjectDetectionController');
  
  // Add vision capabilities to response locals
  res.locals.visionCapabilities = {
    objectDetection: objectDetection.isConfigured,
    features: Object.keys(visionConfig.features).filter(feature => visionConfig.features[feature]),
    maxImageSize: visionConfig.google.maxImageSize,
    supportedFormats: visionConfig.google.supportedFormats
  };
  
  next();
};

/**
 * Health check middleware for vision services
 */
const visionHealthCheck = async (req, res) => {
  try {
    const objectDetection = require('../controllers/ObjectDetectionController');
    const health = await objectDetection.healthCheck();
    
    const configValidation = visionConfig.validate();
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      services: {
        google_vision: health
      },
      configuration: {
        validated: configValidation.isValid,
        errors: configValidation.errors,
        features: visionConfig.features
      },
      capabilities: {
        objectDetection: objectDetection.isConfigured,
        maxImageSize: visionConfig.google.maxImageSize,
        supportedFormats: visionConfig.google.supportedFormats
      }
    });
    
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      details: error.message
    });
  }
};

module.exports = {
  validateVisionAPI,
  validateImageForDetection,
  addVisionCapabilities,
  visionHealthCheck
};