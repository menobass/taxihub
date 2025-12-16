/**
 * Error response formatter
 */
exports.errorResponse = (res, statusCode, message, details = null) => {
  const response = {
    success: false,
    error: message
  };

  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }

  return res.status(statusCode).json(response);
};

/**
 * Success response formatter
 */
exports.successResponse = (res, data, message = null) => {
  const response = {
    success: true,
    data
  };

  if (message) {
    response.message = message;
  }

  return res.json(response);
};

/**
 * Async handler wrapper to catch errors
 */
exports.asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validate required fields in request body
 */
exports.validateFields = (fields) => {
  return (req, res, next) => {
    const missing = fields.filter(field => !req.body[field]);
    
    if (missing.length > 0) {
      return res.status(400).json({
        error: 'Missing required fields',
        missing
      });
    }
    
    next();
  };
};
