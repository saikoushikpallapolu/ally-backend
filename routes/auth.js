// routes/auth.js
// FULL CODE BLOCK for Auth Router with Token Bypass for Hackathon Login

const express = require('express');
const router = express.Router();

module.exports = (db, admin) => {

    // POST /api/auth/register - (This works now!)
    router.post('/register', async (req, res) => {
        const { phoneNumber, name, role, disabilityType, rollNumber } = req.body;

        if (!phoneNumber || !name || !role) {
            return res.status(400).send({ message: 'Missing required fields.' });
        }

        try {
            const userRef = db.collection('Users').doc(phoneNumber);
            const doc = await userRef.get();

            if (doc.exists) {
                return res.status(409).send({ message: 'User already registered.' });
            }
            
            const userData = {
                name,
                role,
                isVerified: false,
                isAvailable: role !== 'PWD' ? false : null, 
                disabilityType: role === 'PWD' ? disabilityType : null, 
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

    // POST /api/auth/login - HACKATHON BYPASS FOR ROLE LOOKUP
    router.post('/login', async (req, res) => {
        const { idToken, phoneNumber } = req.body; 

        if (!phoneNumber) {
            return res.status(400).send({ message: 'Missing phone number for login lookup.' });
        }

        try {
            // *** HACKATHON BYPASS: SKIPPING ADMIN.AUTH().VERIFYIDTOKEN(IDTOKEN) ***
            // We use the phone number provided by the client to fetch the user's role directly.
            
            const userDoc = await db.collection('Users').doc(phoneNumber).get();

            if (!userDoc.exists) {
                return res.status(404).send({ message: 'User profile not found. Please register first.' });
            }

            const userProfile = userDoc.data();
            const { role, name } = userProfile;

            // Since we bypassed verification, we return the same mock token.
            res.status(200).send({
                message: 'Login successful.',
                token: idToken, // Echoing the mock token back to the client
                role: role,
                name: name
            });

        } catch (error) {
            console.error("Login lookup error:", error);
            // Returning 500 error will now only happen if Firestore fails to read (highly unlikely now)
            res.status(500).send({ message: 'Login failed due to an internal server issue.' });
        }
    });

    return router;
};