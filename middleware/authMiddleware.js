// middleware/authMiddleware.js
// FULL CODE BLOCK

// This middleware function verifies the Firebase ID Token
// attached to the Authorization header of the request.
const authMiddleware = (admin) => async (req, res, next) => {
    // 1. Check for token in the 'Authorization' header (standard bearer token format)
    const authHeader = req.headers.authorization;
    // Extract the token if the header starts with 'Bearer '
    const idToken = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

    if (!idToken) {
        // Reject if no token is found
        return res.status(401).send({ message: 'Access denied. No authentication token provided.' });
    }

    try {
        // 2. Verify the token using the Firebase Admin SDK
        const decodedToken = await admin.auth().verifyIdToken(idToken);
        
        // 3. Attach user info (phone number, UID) to the request object
        // This makes the user data available in subsequent route handlers.
        req.user = decodedToken;
        
        // Proceed to the next middleware or the route handler
        next(); 

    } catch (error) {
        console.error("Token verification failed:", error);
        // Reject if the token is invalid, expired, or corrupted
        return res.status(401).send({ message: 'Authentication failed. Invalid or expired token.' });
    }
};

module.exports = authMiddleware;