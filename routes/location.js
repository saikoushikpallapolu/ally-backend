// routes/location.js
// FULL CODE BLOCK for Location Router with Optional Middleware Fix

const express = require('express');
const router = express.Router();

// We need the database (db) and the authentication function (authenticate)
// 'authenticate' will be NULL in hackathon mode, which is why we fix the routing below.
module.exports = (db, authenticate) => {

    // Helper: If authenticate is null, use a simple function that immediately calls next()
    const authHandler = authenticate || ((req, res, next) => next());

    // GET /api/location/accessible - Protected Route
    router.get('/accessible', authHandler, async (req, res) => {
        const { latitude, longitude, disabilityType } = req.query;
        
        try {
            let placesRef = db.collection('Places');

            if (disabilityType) {
                placesRef = placesRef.where('accessibilityFeatures', 'array-contains', disabilityType);
            }

            const snapshot = await placesRef.get();
            const locations = [];
            
            snapshot.forEach(doc => {
                locations.push({ id: doc.id, ...doc.data() });
            });
            
            res.status(200).send(locations);

        } catch (error) {
            console.error("Error fetching locations:", error);
            res.status(500).send({ message: 'Server error fetching accessible locations.' });
        }
    });

    // POST /api/location/review - Protected Route
    router.post('/review/:placeId', authHandler, async (req, res) => {
        const placeId = req.params.placeId;
        const { rating, comments } = req.body;
        
        // userId is mocked/derived from token in authHandler
        const userId = req.user ? req.user.phone_number : 'MOCK_USER'; 

        if (!rating || !placeId) {
            return res.status(400).send({ message: 'Missing required fields (rating or placeId).' });
        }

        try {
            // Log the review, but use the mock user ID since middleware is bypassed
            await db.collection('Reviews').add({
                placeId: placeId,
                userId: userId, 
                rating: rating,
                comments: comments || null,
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            res.status(201).send({ message: 'Accessibility review submitted successfully.' });

        } catch (error) {
            console.error("Error submitting review:", error);
            res.status(500).send({ message: 'Server error submitting review.' });
        }
    });

    return router;
};