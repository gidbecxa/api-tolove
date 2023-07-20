const jwt = require('jsonwebtoken');
const { generateNewAccessToken } = require("../Utils/jwt.utils");
const { JWT_REFRESH_SECRET } = require('../configEnv');

// Handle refresh token request
exports.refreshToken = async (req, res) => {
    try {
        // Get the refresh token from the request body
        const refreshToken = req.body.refreshToken;

        // Check if the refreshToken is valid
        if (!refreshToken) {
            return res.status(401).json({ error: "Refresh token not provided" });
        }

        // Verify the refresh token
        jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (err, decoded) => {
            if (err) {
                return res.status(401).json({ error: "Invalid refresh token" });
            }

            // Generate a new access token
            const accessToken = await generateNewAccessToken(decoded.user);

            // Return the new access token
            return res.status(200).json({ accessToken });
        });
    } catch (error) {
        console.error("Error refreshing token:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};