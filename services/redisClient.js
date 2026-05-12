const Redis = require('ioredis');
const logger = require('../utils/logger');

const redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
  lazyConnect: true,
  maxRetriesPerRequest: 1 // Don't crash if Redis is unavailable
});

redisClient.on('error', (err) => {
  logger.error('Redis connection error: ' + err.message);
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis Cache');
});

// Helper to use cache gracefully (fallback to no cache if Redis is down)
const cacheMiddleware = (keyPrefix, ttlSeconds = 300) => {
  return async (req, res, next) => {
    if (redisClient.status !== 'ready') return next(); // Skip cache if down

    const key = `${keyPrefix}:${req.originalUrl}`;
    try {
      const cachedData = await redisClient.get(key);
      if (cachedData) {
        return res.json(JSON.parse(cachedData));
      }
      // Overwrite res.json to cache the output before sending
      const originalJson = res.json.bind(res);
      res.json = (body) => {
        redisClient.setex(key, ttlSeconds, JSON.stringify(body)).catch(e => logger.error(e));
        originalJson(body);
      };
      next();
    } catch (err) {
      logger.error('Cache middleware error: ' + err.message);
      next();
    }
  };
};

// Helper to invalidate cache
const clearCache = async (keyPrefix) => {
  if (redisClient.status !== 'ready') return;
  try {
    const keys = await redisClient.keys(`${keyPrefix}:*`);
    if (keys.length > 0) {
      await redisClient.del(keys);
      logger.info(`Cleared Redis cache for prefix: ${keyPrefix}`);
    }
  } catch (err) {
    logger.error('Failed to clear cache: ' + err.message);
  }
};

module.exports = {
  redisClient,
  cacheMiddleware,
  clearCache
};
