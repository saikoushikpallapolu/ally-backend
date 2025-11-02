// path_test.js
require('dotenv').config();
const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH;

try {
    // Attempt to load the JSON key file
    const serviceAccount = require(serviceAccountPath); 
    console.log('SUCCESS: File loaded successfully.');
    console.log('Project ID found:', serviceAccount.project_id);
} catch (e) {
    console.log('FAILURE: Node.js could not load the file at the specified path.');
    console.error('Error Details:', e.message);
}