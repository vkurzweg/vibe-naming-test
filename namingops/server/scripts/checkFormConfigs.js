require('dotenv').config();
const mongoose = require('mongoose');
const FormConfiguration = require('../src/models/FormConfiguration');

// Default MongoDB connection string
const DEFAULT_MONGO_URI = 'mongodb://localhost:27017/namingops';

// Connect to MongoDB
const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || DEFAULT_MONGO_URI;
    console.log('Connecting to MongoDB with URI:', mongoUri);
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
};

const checkFormConfigs = async () => {
  try {
    await connectDB();
    
    // Find all form configurations
    const configs = await FormConfiguration.find({});
    
    if (configs.length === 0) {
      console.log('No form configurations found in the database.');
      return;
    }
    
    console.log(`\nFound ${configs.length} form configuration(s):`);
    console.log('----------------------------------------');
    
    configs.forEach((config, index) => {
      console.log(`\n[${index + 1}] ${config.name} (${config._id})`);
      console.log(`Active: ${config.isActive}`);
      console.log(`Fields: ${config.fields?.length || 0}`);
      
      if (config.fields && config.fields.length > 0) {
        console.log('\nField Details:');
        config.fields.forEach((field, i) => {
          console.log(`  ${i + 1}. ${field.name} (${field.fieldType}) - ${field.required ? 'Required' : 'Optional'}`);
          if (field.fieldType === 'select' && field.options) {
            console.log(`     Options: ${field.options.join(', ')}`);
          }
        });
      }
      
      console.log('----------------------------------------');
    });
    
    // Check for active configuration
    const activeConfig = await FormConfiguration.findOne({ isActive: true });
    if (!activeConfig) {
      console.log('\nWARNING: No active form configuration found!');
    } else {
      console.log(`\nActive configuration: ${activeConfig.name} (${activeConfig._id})`);
    }
    
  } catch (error) {
    console.error('Error checking form configurations:', error);
  } finally {
    await mongoose.connection.close();
    process.exit(0);
  }
};

checkFormConfigs();
