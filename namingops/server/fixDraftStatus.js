const mongoose = require('mongoose');

const MONGO_URI = 'mongodb+srv://namingTeam:N5cwjrwqjT3G3uhB@cluster0.w4aajkm.mongodb.net/naming-ops?retryWrites=true&w=majority&appName=NamingOps'; // Update if needed
const NamingRequest = require('./src/models/NamingRequest'); // Adjust path if needed

async function patchMissingFormData() {
    await mongoose.connect(MONGO_URI);
  
    const result = await NamingRequest.updateMany(
      { formData: { $exists: false } },
      { $set: { formData: { patched: true } } }
    );
  
    console.log(`Patched ${result.modifiedCount} requests missing formData.`);
    await mongoose.disconnect();
  }
  
  patchMissingFormData().catch(err => {
    console.error(err);
    process.exit(1);
  });