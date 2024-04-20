// Imports
const { JWT_SECRET, JWT_REFRESH_SECRET, JWT_DURATION, JWT_REFRESH_DURATION } = require('../configEnv'); 
var jwt = require('jsonwebtoken');

const JWT_SIGN_SECRET = JWT_SECRET;
const JWT_SIGN_SECRETREFRESH = JWT_REFRESH_SECRET;

// Exported functions
module.exports = {

  generateTokenForUser: function(userData) {

    return jwt.sign({
      userId: userData.id,
      role: userData.role
    },
    JWT_SIGN_SECRET,
    {
      expiresIn: JWT_DURATION
    })
    
  },

  // Generate a new access token
  generateNewAccessToken: function(user) {
    return new Promise((resolve, reject) => {
      const payload = {
        userId: user.id,
        role: user.role
      };

      jwt.sign(
        payload,
        JWT_SIGN_SECRET,
        {expiresIn: JWT_DURATION},
        (err, token) => {
          if (err) {
            reject(err);
          } else {
            resolve (token);
          }
        }
      );
    });
  },

  generateRefreshTokenForUser: function(userData) {

    return jwt.sign({
      userId: userData.id,
      role: userData.role
    },
    JWT_SIGN_SECRETREFRESH,
    {
      expiresIn: JWT_REFRESH_DURATION
    })
    
  },

  
}