// routes/community.js
// FULL CODE BLOCK for SOS Alert and Volunteer Status with Optional Middleware Fix

const express = require('express');
const router = express.Router();

module.exports = (db, admin, authenticate) => {
    // Helper: If authenticate is null (hackathon mode), use a simple function that immediately calls next()
    const authHandler = authenticate || ((req, res, next) => next());

    // POST /api/community/sos/trigger - Protected Route (Now uses authHandler)
    router.post('/sos/trigger', authHandler, async (req, res) => {
        const { latitude, longitude } = req.body;
        const userId = req.user ? req.user.phone_number : 'MOCK_USER';

        if (!latitude || !longitude) {
            return res.status(400).send({ message: 'Missing location data for SOS.' });
        }
        
        try {
            const newSosRef = await db.collection('SOS_Alerts').add({
                userId: userId,
                location: new admin.firestore.GeoPoint(latitude, longitude),
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                status: 'OPEN', 
                assignedTo: null, 
            });
            
            res.status(202).send({ 
                message: 'SOS alert triggered successfully. Searching for nearby volunteer.',
                alertId: newSosRef.id
            });

        } catch (error) {
            console.error("Error triggering SOS:", error);
            res.status(500).send({ message: 'Server error triggering SOS.' });
        }
    });


    // GET /api/community/sos/alerts - Protected Route (Now uses authHandler)
    router.get('/sos/alerts', authHandler, async (req, res) => {
        try {
            const snapshot = await db.collection('SOS_Alerts')
                                     .where('status', '==', 'OPEN')
                                     .limit(10)
                                     .get();
            
            const alerts = [];
            snapshot.forEach(doc => {
                alerts.push({ id: doc.id, ...doc.data() });
            });

            res.status(200).send(alerts);

        } catch (error) {
            console.error("Error fetching SOS alerts:", error);
            res.status(500).send({ message: 'Server error fetching alerts.' });
        }
    });


    // POST /api/community/volunteer/status - Protected Route (Now uses authHandler)
    router.post('/volunteer/status', authHandler, async (req, res) => {
        const { isAvailable, latitude, longitude } = req.body;
        const userId = req.user ? req.user.phone_number : 'MOCK_USER';
        
        if (typeof isAvailable !== 'boolean') {
            return res.status(400).send({ message: 'Missing or invalid isAvailable status.' });
        }

        try {
            await db.collection('Users').doc(userId).update({
                isAvailable: isAvailable
            });

            if (isAvailable && latitude && longitude) {
                await db.collection('Volunteers_Locations').doc(userId).set({
                    location: new admin.firestore.GeoPoint(latitude, longitude),
                    lastUpdated: admin.firestore.FieldValue.serverTimestamp()
                });
            } else if (!isAvailable) {
                // Delete location if the volunteer logs off
                await db.collection('Volunteers_Locations').doc(userId).delete();
            }

            res.status(200).send({ message: `Volunteer status set to ${isAvailable ? 'available' : 'unavailable'}.` });

        } catch (error) {
            console.error("Error updating volunteer status:", error);
            res.status(500).send({ message: 'Server error updating status.' });
        }
    });

    return router;
};