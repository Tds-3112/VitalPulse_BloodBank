const logger = require('../utils/logger');

const metricsMiddleware = (req, res, next) => {
  const start = process.hrtime.bigint();

  const originalEnd = res.end;
  res.end = function (...args) {
    const end = process.hrtime.bigint();
    const durationMs = Number(end - start) / 1e6;
    const responseTime = durationMs.toFixed(2);

    // Only set header if headers haven't been sent
    if (!res.headersSent) {
      res.setHeader('X-Response-Time', `${responseTime}ms`);
    }

    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      ip: req.ip,
    };

    if (durationMs > 1000) {
      logger.warn(`Slow request: ${JSON.stringify(logData)}`);
    }

    originalEnd.apply(res, args);
  };

  next();
};

module.exports = metricsMiddleware;
