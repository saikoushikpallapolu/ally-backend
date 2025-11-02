// routes/marketplace.js
// FULL CODE BLOCK for Accessibility Marketplace with Optional Middleware Fix

const express = require('express');
const router = express.Router();

module.exports = (db, authenticate) => {
    // Helper: If authenticate is null (hackathon mode), use a simple function that immediately calls next()
    const authHandler = authenticate || ((req, res, next) => next());

    // GET /api/marketplace/products - Protected Route (Now uses authHandler)
    router.get('/products', authHandler, async (req, res) => {
        try {
            const snapshot = await db.collection('Products')
                                     .where('isVerified', '==', true) 
                                     .limit(20)
                                     .get();
            
            const products = [];
            snapshot.forEach(doc => {
                products.push({ id: doc.id, ...doc.data() });
            });

            res.status(200).send(products);

        } catch (error) {
            console.error("Error fetching products:", error);
            res.status(500).send({ message: 'Server error fetching products.' });
        }
    });

    // GET /api/marketplace/products/:productId - Protected Route (Now uses authHandler)
    router.get('/products/:productId', authHandler, async (req, res) => {
        const productId = req.params.productId;

        try {
            const productDoc = await db.collection('Products').doc(productId).get();

            if (!productDoc.exists) {
                return res.status(404).send({ message: 'Product not found.' });
            }
            
            res.status(200).send({ id: productDoc.id, ...productDoc.data() });

        } catch (error) {
            console.error("Error fetching product details:", error);
            res.status(500).send({ message: 'Server error fetching product details.' });
        }
    });

    // POST /api/marketplace/checkout - Protected Route (Now uses authHandler)
    router.post('/checkout', authHandler, async (req, res) => {
        const { items, totalAmount } = req.body;
        // userId is mocked/derived from token if middleware is bypassed
        const userId = req.user ? req.user.phone_number : 'MOCK_USER'; 
        
        try {
            const orderRef = await db.collection('Orders').add({
                userId: userId,
                items: items,
                totalAmount: totalAmount,
                status: 'Processing',
                createdAt: admin.firestore.FieldValue.serverTimestamp()
            });

            res.status(200).send({
                message: 'Order received. Payment simulation successful.',
                orderId: orderRef.id,
                paymentStatus: 'PAID' 
            });

        } catch (error) {
            console.error("Error processing checkout:", error);
            res.status(500).send({ message: 'Server error during checkout.' });
        }
    });

    return router;
};