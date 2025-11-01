// server.js
// FULL CODE BLOCK for Marketplace Router Integration (Final Integration)

// 1. Load environment variables from .env file (must be at the top)
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// 2. Import Firebase Admin SDK
const admin = require('firebase-admin');

// 3. Initialize Firebase Admin SDK
let db; // Declare db variable here so it's accessible globally

try {
  // Load the service account key using the path from the .env file
  const serviceAccount = require(process.env.SERVICE_ACCOUNT_PATH); 

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK Initialized.');
  
  // Assign the Firestore reference to the db variable
  db = admin.firestore();

} catch (error) {
  console.error('FIREBASE INITIALIZATION ERROR: Check SERVICE_ACCOUNT_PATH in .env file.');
  console.error(error.message);
}


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); // To parse JSON request bodies


// --- ROUTER INTEGRATION ---
// 4. Import all necessary Routers and Middleware
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');
const locationRoutes = require('./routes/location'); 
const communityRoutes = require('./routes/community'); 
const marketplaceRoutes = require('./routes/marketplace'); // NEW IMPORT

// 5. Use Auth Router for login/register (These routes do NOT require a token)
app.use('/api/auth', authRoutes(db, admin)); 


// --- GLOBAL MIDDLEWARE ---
// 6. Define the middleware function globally, passing the 'admin' object
const authenticate = authMiddleware(admin);

// 7. Use Feature Routers (These routes REQUIRE the 'authenticate' middleware)
app.use('/api/location', locationRoutes(db, authenticate)); 
app.use('/api/community', communityRoutes(db, admin, authenticate)); 
app.use('/api/marketplace', marketplaceRoutes(db, authenticate)); // NEW INTEGRATION


// --- TEST ROUTE ---
// Simple Route to test the server and connection status
app.get('/', (req, res) => {
  if (db) {
    res.send('ALLY Backend is Running and ALL Routers Integrated!');
  } else {
    res.status(500).send('ALLY Backend is Running but Firebase connection failed.');
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});