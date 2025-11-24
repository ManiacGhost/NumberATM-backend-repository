const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();
// Middleware to verify JWT token
exports.verifyToken = async(req, res, next) => {
    const token = req.headers['authorization']; // Assume token is sent in the 'Authorization' header
    // console.log(token,req.body)
    if (!token) {
        return res.status(401).json({ message: 'No token provided, authorization denied' });
    }
    // Remove "Bearer " if it's part of the token string
    const bearerToken = token.startsWith('Bearer ') ? token.slice(7) : token;

    jwt.verify(bearerToken, process.env.JWT_SECRET, async(err, decoded) => {
        if (err) {
            console.log(err)
            return res.status(401).json({ message: 'Token is not valid' });
        }
        const admin = decoded.username
        // // console.log(decoded);
        if (admin!=="admin@NA.com") {
            return res.status(400).json({ message: "You're not an admin" });
        }
        req.user = admin; // Attach the decoded user information to the request object
        next(); // Proceed to the next middleware or route handler
    });
};