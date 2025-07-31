const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');
const logger = require('../src/utils/logger');

// Use the same connection string as in db.js
const uri = process.env.MONGODB_URI || "mongodb+srv://namingTeam:N5cwjrwqjT3G3uhB@cluster0.w4aajkm.mongodb.net/naming-ops?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  connectTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  serverSelectionTimeoutMS: 5000,
  maxPoolSize: 5,
  minPoolSize: 1,
  retryWrites: true,
  tls: true,
  serverApi: {
    version: '1',
    strict: false,
    deprecationErrors: true,
  }
});

async function createDevUser() {
  let db;
  try {
    // Connect to MongoDB
    await client.connect();
    logger.info('Connected to MongoDB');
    db = client.db();

    // Check if the dev user already exists
    const existingUser = await db.collection('users').findOne({ email: 'dev@example.com' });
    
    if (existingUser) {
      logger.info('Development user already exists');
      return;
    }

    // Create a new user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('password123', salt);

    const devUser = {
      name: 'Development User',
      email: 'dev@example.com',
      password: hashedPassword,
      role: 'admin',
      isActive: true,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('users').insertOne(devUser);
    logger.info('Development user created successfully');
  } catch (error) {
    logger.error('Error creating development user:', error);
    throw error;
  } finally {
    if (client) {
      await client.close();
    }
  }
}

createDevUser()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
