// Quick database fix script
// Run this in MongoDB shell or as a Node.js script

// 1. Deactivate all forms
db.formconfigurations.updateMany({}, { $set: { isActive: false } });

// 2. Find and activate the "hello world" form
db.formconfigurations.updateOne(
  { name: /hello world/i }, // Case-insensitive search
  { $set: { isActive: true } }
);

// 3. Verify the result
db.formconfigurations.find({}, { name: 1, isActive: 1 });
