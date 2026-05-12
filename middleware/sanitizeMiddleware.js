const xss = require('xss');

/**
 * Custom middleware to sanitize request data to prevent XSS attacks.
 * Unlike older libraries, this manually iterates over the body, query, and params.
 */
const sanitizeData = (data) => {
  if (typeof data === 'string') {
    return xss(data);
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeData(item));
  }
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const key in data) {
      sanitized[key] = sanitizeData(data[key]);
    }
    return sanitized;
  }
  return data;
};

const sanitizeMiddleware = (req, res, next) => {
  if (req.body) req.body = sanitizeData(req.body);
  if (req.query) {
    // We create a new object for query because it might be protected/read-only in some versions
    const sanitizedQuery = sanitizeData(req.query);
    // Replace the query object properties
    Object.keys(req.query).forEach(key => {
      req.query[key] = sanitizedQuery[key];
    });
  }
  if (req.params) {
    const sanitizedParams = sanitizeData(req.params);
    Object.keys(req.params).forEach(key => {
      req.params[key] = sanitizedParams[key];
    });
  }
  next();
};

module.exports = sanitizeMiddleware;
