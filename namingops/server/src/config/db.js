const { MongoClient, ServerApiVersion } = require('mongodb');

// Use environment variable for the connection string with a fallback for development
const uri = process.env.MONGODB_URI || "mongodb+srv://namingTeam:N5cwjrwqjT3G3uhB@cluster0.w4aajkm.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
  // Connection pool options
  maxPoolSize: 10, // Maximum number of connections in the connection pool
  minPoolSize: 1,  // Minimum number of connections in the connection pool
  maxIdleTimeMS: 10000, // Maximum time a connection can be idle before being removed from the pool
  connectTimeoutMS: 10000, // How long to wait for a connection to be established
  socketTimeoutMS: 45000, // How long to wait for a response from the server
});

// Cache the database connection
let cachedDb = null;

/**
 * Connects to the MongoDB database and returns the database instance
 * Implements connection pooling and caches the connection
 * @returns {Promise<import('mongodb').Db>} MongoDB database instance
 */
async function connectToDatabase() {
  if (cachedDb) {
    console.log('Using cached database connection');
    return cachedDb;
  }

  try {
    // Connect the client to the server
    await client.connect();
    
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Successfully connected to MongoDB!");
    
    // Select the database
    const db = client.db(process.env.MONGODB_DB_NAME || 'naming-ops');
    
    // Cache the database connection
    cachedDb = db;
    
    return db;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    // Close the client if there's an error
    await client.close();
    throw error; // Re-throw the error to be handled by the caller
  }
}

// Handle application termination
process.on('SIGINT', async () => {
  try {
    await client.close();
    console.log('MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    console.error('Error closing MongoDB connection:', error);
    process.exit(1);
  }
});

// Handle uncaught exceptions
process.on('uncaughtException', async (error) => {
  console.error('Uncaught Exception:', error);
  try {
    await client.close();
  } catch (e) {
    console.error('Error closing MongoDB connection after uncaught exception:', e);
  }
  process.exit(1);
});

module.exports = {
  connectToDatabase,
  getClient: () => client,
};
