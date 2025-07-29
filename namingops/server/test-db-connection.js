require('dotenv').config();
const { connectToDatabase, getClient } = require('./src/config/db');

async function testConnection() {
  console.log('Testing MongoDB connection...');
  
  try {
    // Test connection
    const db = await connectToDatabase();
    console.log('✅ Successfully connected to MongoDB!');
    
    // Test basic database operations
    console.log('\nTesting basic database operations...');
    
    // Get the database name
    const dbName = db.databaseName;
    console.log(`📊 Using database: ${dbName}`);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('\n📋 Collections in database:');
    collections.forEach((collection, index) => {
      console.log(`${index + 1}. ${collection.name}`);
    });
    
    // Get server status
    const status = await db.command({ serverStatus: 1 });
    console.log('\n🔄 Database status:');
    console.log(`- Version: ${status.version}`);
    console.log(`- Uptime: ${Math.floor(status.uptime / 60)} minutes`);
    
    console.log('\n✅ All tests completed successfully!');
    
  } catch (error) {
    console.error('❌ Error testing MongoDB connection:', error);
    process.exit(1);
  } finally {
    // Close the connection
    const client = getClient();
    if (client) {
      await client.close();
      console.log('\n🔌 MongoDB connection closed');
    }
    process.exit(0);
  }
}

// Run the test
testConnection();
