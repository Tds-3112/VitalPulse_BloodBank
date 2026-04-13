const mongoose = require('mongoose');
const logger = require('../utils/logger');
const env = require('./env');

const connectDB = async () => {
  try {
    let uri = env.MONGODB_URI;

    // Use in-memory MongoDB for development if regular MongoDB is not available
    if (env.isDev || env.isTest) {
      try {
        // Try connecting to regular MongoDB first
        await mongoose.connect(uri, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 3000,
          socketTimeoutMS: 45000,
        });
        logger.info(`MongoDB connected: ${mongoose.connection.host}/${mongoose.connection.name}`);
        return mongoose.connection;
      } catch (err) {
        logger.warn('Local MongoDB not available, starting in-memory MongoDB...');
        await mongoose.disconnect();

        const { MongoMemoryServer } = require('mongodb-memory-server');
        const mongod = await MongoMemoryServer.create();
        uri = mongod.getUri();

        const conn = await mongoose.connect(uri, {
          maxPoolSize: 10,
          serverSelectionTimeoutMS: 5000,
          socketTimeoutMS: 45000,
        });
        logger.info(`In-memory MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);

        // Auto-seed data when using in-memory DB
        const seed = require('../seed');
        await seed();

        // Store reference for cleanup
        process.mongod = mongod;
        return conn;
      }
    }

    const conn = await mongoose.connect(uri, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    logger.info(`MongoDB connected: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (error) {
    logger.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  logger.error(`MongoDB error: ${err.message}`);
});

module.exports = connectDB;
