require('dotenv').config();
const mongoose = require('mongoose');
const axios = require('axios');
const ApprovedName = require('./models/ApprovedName');

// --- YOUR CUSTOMIZATIONS HERE ---
const API_KEY = process.env.SHEETS_API_KEY;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;
const SHEET_NAME = 'approvedNames'; // e.g., 'COMPLETE LIST'
const MONGODB_URI = process.env.MONGODB_URI;

const RANGE = `${SHEET_NAME}!A:M`; // Adjust the range to cover all your data

// --- DO NOT CHANGE ANYTHING BELOW THIS LINE ---
async function importDataFromGoogleSheets() {
  try {
    // 1. Fetch data from Google Sheets API
    console.log('Fetching data from Google Sheets...');
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${RANGE}?key=${API_KEY}`;
    const response = await axios.get(url);
    const rows = response.data.values;

    if (!rows || rows.length === 0) {
      console.log('No data found in the Google Sheet.');
      return;
    }

    // Extract headers from the first row
    const headers = rows[0];
    const dataRows = rows.slice(1);

    // 2. Convert data to an array of JSON objects
    const jsonData = dataRows.map(row => {
      const obj = {};
      headers.forEach((header, index) => {
        // Use the header as the key and the row value as the value
        obj[header] = row[index];
      });
      return obj;
    });

    // 3. Connect to MongoDB and import data
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB connected.');

    // Clear existing data before inserting new data (optional but good practice for re-runs)
    await ApprovedName.deleteMany({});
    console.log('Existing data cleared.');

    // Insert the new data
    await ApprovedName.insertMany(jsonData);
    console.log('Data successfully imported!');

  } catch (err) {
    console.error('An error occurred:', err.response ? err.response.data.error.message : err.message);
  } finally {
    // Close the connection
    if (mongoose.connection.readyState === 1) {
      mongoose.connection.close();
      console.log('MongoDB connection closed.');
    }
  }
}

importDataFromGoogleSheets();