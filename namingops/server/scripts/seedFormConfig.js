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
    console.log('\nTroubleshooting tips:');
    console.log('1. Make sure MongoDB is running locally');
    console.log('2. Check if the MONGO_URI in .env is correct');
    console.log('3. Try running MongoDB with: mongod');
    process.exit(1);
  }
};

// Default form configuration
const defaultFormConfig = {
  name: 'Default Naming Request Form',
  description: 'Default form configuration for development',
  isActive: true,
  fields: [
    {
      name: 'projectName',
      label: 'Project Name',
      fieldType: 'text',
      required: true,
      placeholder: 'Enter project name',
      validation: {
        minLength: 3,
        maxLength: 50
      }
    },
    {
      name: 'projectDescription',
      label: 'Project Description',
      fieldType: 'textarea',
      required: true,
      placeholder: 'Describe your project in detail',
      validation: {
        minLength: 10,
        maxLength: 500
      }
    },
    {
      name: 'projectType',
      label: 'Project Type',
      fieldType: 'select',
      required: true,
      options: [
        'Web Application',
        'Mobile Application',
        'API Service',
        'Database',
        'Infrastructure',
        'Other'
      ],
      defaultValue: 'Web Application'
    },
    {
      name: 'targetAudience',
      label: 'Target Audience',
      fieldType: 'checkbox',
      options: [
        'Internal Users',
        'External Customers',
        'Partners',
        'General Public'
      ],
      defaultValue: ['Internal Users']
    },
    {
      name: 'launchDate',
      label: 'Expected Launch Date',
      fieldType: 'date',
      required: false
    },
    {
      name: 'teamName',
      label: 'Team/Department',
      fieldType: 'text',
      required: true,
      placeholder: 'Enter your team or department name'
    },
    {
      name: 'contactEmail',
      label: 'Contact Email',
      fieldType: 'text',
      required: true,
      placeholder: 'your.email@example.com',
      validation: {
        pattern: '^[^\s@]+@[^\s@]+\.[^\s@]+$',
        patternMessage: 'Please enter a valid email address'
      }
    }
  ]
};

const seedFormConfig = async () => {
  try {
    // Connect to MongoDB
    await connectDB();
    
    // Deactivate any existing active configurations
    await FormConfiguration.updateMany(
      { isActive: true },
      { $set: { isActive: false } }
    );
    
    // Create new default configuration
    const formConfig = new FormConfiguration(defaultFormConfig);
    await formConfig.save();
    
    console.log('✅ Default form configuration created successfully!');
    console.log('Config ID:', formConfig._id);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding form configuration:', error.message);
    process.exit(1);
  }
};

// Run the seed function
seedFormConfig();
