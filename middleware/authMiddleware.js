const jwt = require('jsonwebtoken');

/**
 * Middleware to verify if a user is authenticated using JWT.
 */
exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Format: "Bearer TOKEN"

  if (!token) {
    return res.status(403).json({ message: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
};

/**
 * Middleware to restrict access to specific roles.
 */
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    const userRole = req.user?.role?.toLowerCase();
    const allowedRoles = roles.map(r => r.toLowerCase());

    if (!req.user || !allowedRoles.includes(userRole)) {
      console.warn(`🔒 Access Denied: User ${req.user?.id} with role [${req.user?.role}] tried to access a route requiring [${roles.join(', ')}]`);
      return res.status(403).json({ message: 'Access denied: Insufficient permissions' });
    }
    next();
  };
};
