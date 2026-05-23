const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    logger.info(`Access: ${req.method} ${req.path} by user ${decoded.userId} (${decoded.role})`, { module: 'AUTH' });
    next();
  } catch (err) {
    logger.warn(`Invalid token attempt: ${err.message}`, { module: 'AUTH' });
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    logger.warn(`Forbidden: user ${req.user?.userId} (${req.user?.role}) tried to access ${req.path}`, { module: 'AUTH' });
    return res.status(403).json({ error: 'Insufficient permissions' });
  }
  next();
};

module.exports = { verifyToken, requireRole };
