require('dotenv').config();
const mongoose = require('mongoose');
const { createIndex, bulkIndexNameRequests } = require('../src/config/elasticsearch');
const User = require('../src/models/User');
const NameRequest = require('../src/models/NameRequest');
const logger = require('../src/utils/logger');

// Sample data
const sampleUsers = [
  {
    name: 'Admin User',
    email: 'admin@example.com',
    password: 'Admin@123',
    role: 'admin',
    isActive: true,
    emailVerified: true
  },
  {
    name: 'Reviewer One',
    email: 'reviewer1@example.com',
    password: 'Reviewer@123',
    role: 'reviewer',
    isActive: true,
    emailVerified: true
  },
  {
    name: 'Submitter One',
    email: 'submitter1@example.com',
    password: 'Submitter@123',
    role: 'submitter',
    isActive: true,
    emailVerified: true
  }
];

const sampleNameRequests = [
  {
    request_title: 'New Product Launch - Cloud Storage',
    requestor_name: 'Submitter One',
    requestor_id: 3, // Will be updated with actual user ID
    business_unit: 'Cloud Services',
    asset_type: 'Product',
    asset_description: 'A new cloud storage solution for enterprise customers with enhanced security features.',
    proposed_name_1: 'SecureCloud Pro',
    proposed_name_2: 'Enterprise Vault',
    proposed_name_3: 'CloudFortress',
    status: 'New',
    request_date: new Date()
  },
  {
    request_title: 'Internal HR Portal',
    requestor_name: 'Submitter One',
    requestor_id: 3, // Will be updated with actual user ID
    business_unit: 'Human Resources',
    asset_type: 'Internal Tool',
    asset_type_specify: 'Employee Portal',
    asset_description: 'A portal for employees to manage their HR-related tasks and information.',
    proposed_name_1: 'PeopleHub',
    proposed_name_2: 'Workplace Connect',
    status: 'In Progress',
    reviewer_id: 2, // Will be updated with actual user ID
    request_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
  },
  {
    request_title: 'Customer Analytics Dashboard',
    requestor_name: 'Submitter One',
    requestor_id: 3, // Will be updated with actual user ID
    business_unit: 'Analytics',
    asset_type: 'Feature',
    asset_description: 'A dashboard for customers to view and analyze their usage data and metrics.',
    proposed_name_1: 'Insight360',
    proposed_name_2: 'DataPulse',
    proposed_name_3: 'MetricView',
    status: 'Legal Review',
    reviewer_id: 2, // Will be updated with actual user ID
    request_date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000), // 10 days ago
    reviewer_notes: 'Need to check for trademark conflicts.'
  },
  {
    request_title: 'API Gateway',
    requestor_name: 'Submitter One',
    requestor_id: 3, // Will be updated with actual user ID
    business_unit: 'Platform Engineering',
    asset_type: 'Platform',
    asset_description: 'A unified API gateway for all our microservices.',
    proposed_name_1: 'Nexus Gateway',
    proposed_name_2: 'API Nexus',
    status: 'Approved',
    reviewer_id: 2, // Will be updated with actual user ID
    request_date: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // 15 days ago
    approval_date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
    final_approved_name: 'Nexus Gateway',
    approval_notes: 'Name approved by legal and marketing teams.'
  },
  {
    request_title: 'Employee Recognition Program',
    requestor_name: 'Submitter One',
    requestor_id: 3, // Will be updated with actual user ID
    business_unit: 'Human Resources',
    asset_type: 'Program',
    asset_description: 'A program to recognize and reward outstanding employee contributions.',
    proposed_name_1: 'Star Performer',
    proposed_name_2: 'Achievers Circle',
    status: 'On Hold',
    reviewer_id: 2, // Will be updated with actual user ID
    request_date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    reviewer_notes: 'Waiting for budget approval.'
  }
];

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/namingops', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true,
      useFindAndModify: false
    });
    
    logger.info('Connected to MongoDB');
    return true;
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    return false;
  }
};

// Clear existing data
const clearDatabase = async () => {
  try {
    await User.deleteMany({});
    await NameRequest.deleteMany({});
    logger.info('Cleared existing data');
    return true;
  } catch (error) {
    logger.error('Error clearing database:', error);
    return false;
  }
};

// Seed users
const seedUsers = async () => {
  try {
    const createdUsers = [];
    
    for (const userData of sampleUsers) {
      const user = new User(userData);
      await user.save();
      createdUsers.push(user);
      logger.info(`Created user: ${user.email}`);
    }
    
    return createdUsers;
  } catch (error) {
    logger.error('Error seeding users:', error);
    return [];
  }
};

// Seed name requests
const seedNameRequests = async (users) => {
  try {
    const adminUser = users.find(u => u.role === 'admin');
    const reviewerUser = users.find(u => u.role === 'reviewer');
    const submitterUser = users.find(u => u.role === 'submitter');
    
    if (!adminUser || !reviewerUser || !submitterUser) {
      throw new Error('Required users not found');
    }
    
    // Update requestor_id and reviewer_id in sample data
    const updatedRequests = sampleNameRequests.map(request => ({
      ...request,
      requestor_id: submitterUser._id,
      reviewer_id: request.reviewer_id ? reviewerUser._id : null
    }));
    
    const createdRequests = [];
    
    for (const requestData of updatedRequests) {
      const nameRequest = new NameRequest(requestData);
      await nameRequest.save();
      createdRequests.push(nameRequest);
      logger.info(`Created name request: ${nameRequest.request_title}`);
    }
    
    return createdRequests;
  } catch (error) {
    logger.error('Error seeding name requests:', error);
    return [];
  }
};

// Main setup function
const setup = async () => {
  try {
    logger.info('Starting database setup...');
    
    // Connect to MongoDB
    const isConnected = await connectDB();
    if (!isConnected) {
      throw new Error('Failed to connect to MongoDB');
    }
    
    // Clear existing data
    await clearDatabase();
    
    // Seed users
    logger.info('Seeding users...');
    const users = await seedUsers();
    
    if (users.length === 0) {
      throw new Error('Failed to seed users');
    }
    
    // Seed name requests
    logger.info('Seeding name requests...');
    const nameRequests = await seedNameRequests(users);
    
    // Initialize Elasticsearch
    if (process.env.ELASTICSEARCH_ENABLED === 'true') {
      logger.info('Initializing Elasticsearch...');
      await createIndex('name_requests');
      await bulkIndexNameRequests();
    }
    
    logger.info('Setup completed successfully!');
    logger.info('\n=== Sample Users ===');
    users.forEach(user => {
      logger.info(`Email: ${user.email} | Password: ${sampleUsers.find(u => u.email === user.email).password} | Role: ${user.role}`);
    });
    
    process.exit(0);
  } catch (error) {
    logger.error('Setup failed:', error);
    process.exit(1);
  }
};

// Run setup
setup();
