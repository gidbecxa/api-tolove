const jwtUtils = require("../Utils/jwt.utils");
const bcrypt = require("bcrypt");
const { PrismaClient } = require('@prisma/client')
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, VERIFICATION_SID } = require("../configEnv");
const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const logger = require('../logger')();
// var getSign = require('horoscope').getSign;
// const dayjs = require('dayjs')

const prisma = new PrismaClient();

module.exports = {

    register: async function (req, res) {
        const { pays, phoneNumber } = req.body;
        let verificationRequest;

        try {
            const response = await prisma.user.findMany({
                skip: 0,
                take: 1,
                where: {
                    phoneNumber: {
                        equals: phoneNumber,
                    },
                },
            })

            if (response.length > 0) {
                return res.status(422).send({ success: false, msg: 'This phone number is already in use' });
            } else {
                verificationRequest = await twilio.verify.v2.services(VERIFICATION_SID)
                    .verifications
                    .create({ to: phoneNumber, channel: 'sms' });
                // .then(verification => console.log('sid:', verification.sid));

                res.status(201).send({
                    success: true,
                    msg: 'Verification code sent successfully',
                })
            }
        } catch (error) {
            logger.error(error);
            return res.status(500).send(error);
            // return res.status(500).json({error: 'Failed to send verification code'});
        }

        logger.debug(verificationRequest);
    },

    verify: async function (req, res) {
        // const { verificationCode: code } = req.body;
        const { code, phoneNumber, pays } = req.body;
        console.log(code, pays, phoneNumber);

        let verificationResult;
        const errors = { wasValidated: true };

        try {
            verificationResult = await twilio.verify.v2.services(VERIFICATION_SID)
                .verificationChecks
                .create({ to: phoneNumber, code: code })
        } catch (error) {
            logger.error(error);
            return res.status(500).send(error);
        }

        logger.debug(verificationResult);

        if (verificationResult.status === 'approved') {
            console.log('Attempting to create user...');
            try {
                const user = await prisma.user.create({
                    data: {
                        phoneNumber: phoneNumber,
                        pays: pays,
                    },
                });

                const userId = user.id;
                const accessToken = jwtUtils.generateTokenForUser(user);
                const refreshToken = jwtUtils.generateRefreshTokenForUser(user);

                res.status(201).send({
                    success: true,
                    msg: 'User was created successfully',
                    data: {
                        'userId': userId,
                        'access_token': accessToken,
                        'refresh_token': refreshToken,
                    },
                });
            } catch (error) {
                res.status(500).send({
                    success: false,
                    msg: error.message || 'Some error occurred while creating the user',
                });
            }
        }
        // errors.verificationCode = `Unable to verify code. status: ${verificationResult.status}`;
    },

    /* register: async function (req, res) {

        const { username, email, password } = req.body

        try {

            const response = await prisma.user.findMany({
                skip: 0,
                take: 1,
                where: {
                    OR: [
                        {
                            username: {
                                equals: username,
                            },
                        },
                        {
                            email: {
                                equals: email,
                            },
                        },
                    ],
                },
            })

            if (response.length > 0) {
                return res.status(422).send({ success: false, msg : "user already existe"});
            } 
            else 
            {
                // const horoscope = getSign({month: dayjs(birthday).get('month')+1, day: dayjs(birthday).get('date') });
                const hashed = bcrypt.hashSync(password, 10);

                await prisma.user.create({
                    data: {
                        username: username,
                        email: email,
                        password: hashed
                    },
                })
                .then(() => {
                    res.status(201).send({
                        success: true,
                        msg: 'User was created successfully',
                    })
                })
                .catch((error) => {

                    res.status(500).send({
                        success: false,
                        msg: error.message || 'Some error occurred while creating the user',
                    })

                })
            }

        } 
        catch (error) {
            res.status(400).json({success: false, msg: error.message});
        }
    
    }, */

    login: async function (req, res) {

        const { usernameOrEmail, password } = req.body

        await prisma.user.findMany({
            skip: 0,
            take: 1,
            where: {
                OR: [
                    {
                        username: {
                            equals: usernameOrEmail,
                        },
                    },
                    {
                        email: {
                            equals: usernameOrEmail,
                        },
                    },
                ],
            },
            select: {
                id: true,
                email: true,
                username: true,
                password: true,
                role: true
            }
        })
            .then((userFound) => {

                if (userFound.length > 0) {

                    // console.log(userFound[0]);

                    bcrypt.compare(password, userFound[0].password, (errBycrypt, resBycrypt) => {

                        if (resBycrypt) {
                            //refresh token...
                            res.status(201).json({
                                success: true,
                                data: {
                                    'userId': userFound[0].id,
                                    'access_token': jwtUtils.generateTokenForUser(userFound[0]),
                                    'refresh_token': jwtUtils.generateRefreshTokenForUser(userFound[0])
                                }
                            });

                        } else {
                            //message d'erreur mdp ou mail...
                            res.status(403).json({ success: false, msg: 'username, email ou password invalide' });
                        }

                    });

                }
                else {
                    res.status(404).json({ success: false, msg: 'cet utilisateur n\'existe pas' });
                }

            })
            .catch((err) => {
                console.log(err);
                res.status(500).json({ success: false, msg: 'unable to verify user' });
            });

    }

}
