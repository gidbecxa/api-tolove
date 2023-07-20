const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();
const { User } = prisma;
const {JWT_SECRET } = require('../configEnv');
 
exports.authMiddleware = async (req, res, next) => {

  try {

    const { headers } = req;
    //console.log(headers);

    /* 1. On vérifie que le header Authorization est présent dans la requête */
    if (!headers || !headers.authorization) {
      return res.status(401).json({
        success: false,
        msg: 'Missing Authorization header'
      });
    }
 
    /* 2. On vérifie que le header Authorization contient bien le token */
    const [scheme, token] = headers.authorization.split(' ');
    // console.log(token);
 
    if (!scheme || scheme.toLowerCase() !== 'bearer' || !token) {
      return res.status(401).json({
        success: false,
        msg: 'Header format is Authorization: Bearer token'
      });
    }
 
    /* 3. On vérifie et décode le token à l'aide du secret et de l'algorithme utilisé pour le générer */
    const decodedToken = jwt.verify(token, JWT_SECRET);

    /* 4. On vérifie que l'utilisateur existe bien dans notre base de données */
    const userId = decodedToken.userId;
    console.log('JWT Verify: userId:', userId);

    const user = await User.findUnique(
      {
        where: { id: userId },
        select: {
          id: true,
          phoneNumber: true,
          username: true,
          photoProfil: true,
          birthday: true,
          horoscope: true,
          hobbies: true,
          langage: true,
          description: true,
          preference: true,
          genre: true,
          coins: true,
          isCertified: true,
          isCompleted: true,
          isFake: true,
          pays: true,
          isOnline: true,
          role: true,
          villes: true,
          deviceToken: true,
        },
      }
    );

    // console.log(user);

    if (!user) {
      return res.status(401).json({
        success: false,
        msg: `User ${userId} not exists`
      });
    }
 
    /* 5. On passe l'utilisateur dans notre requête afin que celui-ci soit disponible pour les prochains middlewares */
    req.user = user;
 
    /* 7. On appelle le prochain middleware */
    return next();

  } catch (err) {

    return res.status(401).json({
      message: 'Invalid token'
    });

  }
}

exports.userMiddleware = (req, res, next) => {
  if (req.user.role !== "USER") {
    return res.status(400).json({ success: false, msg: "User access denied" })
  }
  next()
}

exports.adminMiddleware = (req, res, next) => {
  if (req.user.role !== "ADMIN") {
    return res.status(400).json({success: false, msg: "Admin Access denied" })
  }
  next()
} 

exports.agentMiddleware = (req, res, next) => {
  if (req.user.role !== "AGENT") {
    return res.status(400).json({ success: false, msg: "AGENT Access denied" })
  }
  next()
} 
