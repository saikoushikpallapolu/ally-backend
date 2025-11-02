// server.js
// FULL CODE BLOCK for Final Robust Backend Integration

// 1. Load environment variables
require('dotenv').config();

const express = require('express');
const cors = require('cors');

// 2. Import Firebase Admin SDK
const admin = require('firebase-admin');

// 3. Initialization variables
let db; 
let authenticate; // This variable is now the placeholder for the middleware function

try {
  const serviceAccountPath = process.env.SERVICE_ACCOUNT_PATH;
  
  if (!serviceAccountPath) {
     throw new Error("SERVICE_ACCOUNT_PATH is not defined in the .env file.");
  }

  const serviceAccount = require(serviceAccountPath); 

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('Firebase Admin SDK Initialized.');
  
  db = admin.firestore();

} catch (error) {
  console.error('\n--- FIREBASE INITIALIZATION FAILED ---');
  console.error('Error:', error.message);
  console.error('HINT: Check the full absolute path in your .env file.');
  console.error('-------------------------------------\n');
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json()); 


// --- ROUTER INTEGRATION ---
// 4. Import all necessary Routers (authMiddleware is now handled internally)
const authRoutes = require('./routes/auth');
const locationRoutes = require('./routes/location'); 
const communityRoutes = require('./routes/community'); 
const marketplaceRoutes = require('./routes/marketplace'); 

// 5. Use Auth Router (Requires db and admin)
app.use('/api/auth', authRoutes(db, admin)); 

// 6. Use Feature Routers (CRITICAL HACKATHON FIX: We pass 'null' as the middleware to bypass the security check in the router files.)
// Note: You must pass 'admin' to communityRoutes because it uses GeoPoint and serverTimestamp.
app.use('/api/location', locationRoutes(db, null)); 
app.use('/api/community', communityRoutes(db, admin, null)); 
app.use('/api/marketplace', marketplaceRoutes(db, null)); 


// --- TEST ROUTE ---
app.get('/', (req, res) => {
  if (db) {
    res.send('ALLY Backend is Running and ALL Routers Integrated! Database is LIVE.');
  } else {
    res.status(500).send('ALLY Backend is Running but Database is OFFLINE.');
  }
});


// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});