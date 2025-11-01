// routes/auth.js
const express = require('express');
const router = express.Router();

// We export a function that accepts db and admin objects from server.js
module.exports = (db, admin) => {

    // POST /api/auth/register - Handles creation of PWD, Volunteer, or NGO profile
    router.post('/register', async (req, res) => {
        const { phoneNumber, name, role, disabilityType, rollNumber } = req.body;

        if (!phoneNumber || !name || !role) {
            return res.status(400).send({ message: 'Missing required fields.' });
        }

        try {
            // 1. Check if user profile already exists
            const userRef = db.collection('Users').doc(phoneNumber);
            const doc = await userRef.get();

            if (doc.exists) {
                return res.status(409).send({ message: 'User already registered.' });
            }
            
            // 2. Create the user profile in Firestore with role-specific data
            const userData = {
                name,
                role,
                isVerified: false,
                // Volunteers/NGOs need availability; PwDs need disability type
                isAvailable: role !== 'PWD' ? false : undefined, 
                disabilityType: role === 'PWD' ? disabilityType : undefined, 
                rollNumber: rollNumber || null,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            };

            await userRef.set(userData);

            res.status(201).send({ message: 'User profile created successfully. Proceed to OTP verification/login.' });

        } catch (error) {
            console.error("Registration error:", error);
            res.status(500).send({ message: 'Server error during registration.' });
        }
    });

    // POST /api/auth/login - Handles token verification and role-based authorization
    router.post('/login', async (req, res) => {
        // Receives the Firebase ID Token from the client after OTP is verified
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).send({ message: 'Missing authentication token.' });
        }

        try {
            // 1. Verify the Firebase ID Token using the Admin SDK
            const decodedToken = await admin.auth().verifyIdToken(idToken);
            const phoneNumber = decodedToken.phone_number; // Get UID (phone number)

            // 2. Fetch the custom user profile from Firestore to determine role and access
            const userDoc = await db.collection('Users').doc(phoneNumber).get();

            if (!userDoc.exists) {
                return res.status(404).send({ message: 'User profile not found. Please register first.' });
            }

            const userProfile = userDoc.data();
            const { role, name } = userProfile;

            // 3. Respond with essential data for client-side routing
            res.status(200).send({
                message: 'Login successful.',
                token: idToken,
                role: role,
                name: name
            });

        } catch (error) {
            console.error("Login verification error:", error);
            res.status(401).send({ message: 'Authentication failed. Invalid or expired token.' });
        }
    });

    return router;
};