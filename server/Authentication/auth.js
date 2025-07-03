const { defaultApp } = require('../firebase');

const authenticate = async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(403).json({ success: false, message: 'No token provided or invalid format' });
    }

    const token = authHeader.split(' ')[1]; 

    if (!token) {
        return res.status(403).json({ success: false, message: 'Token not found' });
    }

    try {
        const decodedToken = await defaultApp.auth().verifyIdToken(token);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.error('Token verification error:', error);
        return res.status(401).json({ success: false, message: 'Invalid token', error: error.message });
    }
};

module.exports = authenticate;
