const jwtUtils = require("../Utils/jwt.utils");
const bcrypt = require("bcrypt");
const { PrismaClient } = require('@prisma/client')
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, VERIFICATION_SID } = require("../configEnv");
const twilio = require('twilio')(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
const logger = require('../logger')();
const fs = require('fs');
const { myS3Client } = require("../Utils/s3Client");
const { PutObjectCommand } = require("@aws-sdk/client-s3");
// var getSign = require('horoscope').getSign;
// const dayjs = require('dayjs')

const prisma = new PrismaClient();

module.exports = {

    registerWithTwilio: async function (req, res) {
        const { pays, phoneNumber } = req.body;
        console.log("Attempting to verify user:", phoneNumber);
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
                console.log('User phone number is not yet in use!');

                verificationRequest = await twilio.verify.v2.services(VERIFICATION_SID)
                    .verifications
                    .create({ to: phoneNumber, channel: 'sms' })
                // .then(verification => console.log('Verification data:', verification));

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

    register: async function (req, res) {
        const { pays, phoneNumber } = req.body;
        // let verificationRequest;

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
                res.status(201).send({
                    success: true,
                    code: '001089',
                    msg: 'Verification code sent successfully',
                })
            }
        } catch (error) {
            logger.error(error);
            return res.status(500).send(error);
        }

    },

    sendSigninCode: async function (req, res) {
        const { pays, phoneNumber } = req.body;
        // let verificationRequest;

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
                res.status(201).send({
                    success: true,
                    code: '001089',
                    msg: 'Verification code sent successfully',
                })
            } else {
                return res.status(422).send({ success: false, msg: 'This phone number does not exist' });
            }
        } catch (error) {
            logger.error(error);
            return res.status(500).send(error);
        }

    },

    createUserByAgent: async function (req, res) {
        console.log("Request body:", req.body);
        const { username, pays, phoneNumber, birthday, description, preference, genre, hobbies, ville } = req.body;
        // const birthdayFormatted = new Date(birthday).toISOString().slice(0, 19).replace('T', ' ');
        const birthdayFormatted = new Date(birthday).toISOString().slice(0, 10) + 'T23:00:00.000Z';
        console.log("Attempting to create user:", { username, pays, phoneNumber, birthday, description, preference, genre, hobbies, ville });
        const { agentId } = req.params;
        console.log("Attempting to create user for agent:", { agentId });

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const { filename, path } = file;

        try {
            const existingUser = await prisma.user.findFirst({
                where: {
                    phoneNumber: phoneNumber,
                },
            });

            if (existingUser) {
                return res.status(422).send({ success: false, msg: 'User with this phone number exists already' });
            }

            const uploadParams = {
                Bucket: 'user.dmvision-bucket',
                Key: `user${agentId}/${filename}`,
                Body: fs.createReadStream(path),
                ContentType: file.mimetype
            };

            try {
                const uploadResponse = await myS3Client.send(new PutObjectCommand(uploadParams));
                console.log(
                    "Successfully created " +
                    uploadParams.Key +
                    " and uploaded it to " +
                    uploadParams.Bucket +
                    "/" + uploadParams.Key
                );
            } catch (err) {
                console.log("Error", err);
            }

            const imageUrl = `https://s3.eu-west-2.amazonaws.com/${uploadParams.Bucket}/${uploadParams.Key}`;

            // Create a new user in the database
            const newUser = await prisma.user.create({
                data: {
                    phoneNumber: phoneNumber,
                    username: username,
                    photoProfil: imageUrl,
                    birthday: birthdayFormatted,
                    hobbies: hobbies,
                    description: description,
                    preference: preference,
                    genre: genre,
                    isCertified: true,
                    isCompleted: true,
                    isFake: true,
                    pays: pays,
                    villes: ville,
                    assignedAgent: parseInt(agentId),
                    // preferencePays: preferencePays,
                },
            });

            return res.status(201).send({ success: true, msg: 'User was created successfully', user: newUser });
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ success: false, error: "Failed to create user" });
        }
    },

    createAgent: async function (req, res) {
        console.log("Request body for mod creation:", req.body);
        const { pays, phoneNumber, username } = req.body;
        // console.log("Attempting to create user:", { data });

        const { agentId } = req.params;
        console.log("Attempting to create user for agent:", { agentId });

        try {
            const existingUser = await prisma.user.findFirst({
                where: {
                    phoneNumber: phoneNumber,
                },
            });

            if (existingUser) {
                return res.status(422).send({ success: false, msg: 'User with this phone number exists already' });
            }

            // Create a new user in the database
            const newUser = await prisma.user.create({
                data: {
                    phoneNumber: phoneNumber,
                    username: username,
                    pays: pays,
                    role: 'AGENT',
                    // assignedAgent: parseInt(agentId),
                },
            });

            return res.status(201).send({ success: true, msg: 'User was created successfully', user: newUser });
        } catch (error) {
            console.error('Error creating user:', error);
            res.status(500).json({ success: false, error: "Failed to create user" });
        }
    },

    verifyViaTwilio: async function (req, res) {
        // const { verificationCode: code } = req.body;
        const { code, phoneNumber, pays } = req.body;
        console.log(code, pays, phoneNumber);

        let verificationResult;
        const errors = { wasValidated: true };

        try {
            verificationResult = await twilio.verify.v2.services(VERIFICATION_SID)
                .verificationChecks
                .create({ to: phoneNumber, code: code })
            // .then(verification_check => console.log('Verification result data', verification_check));

            if (verificationResult && verificationResult.status === 'approved') {
                console.log('Verification approved. Attempting to create user...');

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
            } else {
                console.log('Verification not approved.');
                res.status(422).send({
                    success: false,
                    msg: 'Verification failed. Please check the verification code.',
                });
            }
        } catch (error) {
            logger.error(error);
            return res.status(500).send(error);
        }

        logger.debug(verificationResult);


        // errors.verificationCode = `Unable to verify code. status: ${verificationResult.status}`;
    },

    verifyCompany: async function (req, res) {
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
                const company = await prisma.company.create({
                    data: {
                        phoneNumber: phoneNumber,
                        country: pays,
                    },
                });

                const companyId = company.id;
                const accessToken = jwtUtils.generateTokenForUser(company);
                const refreshToken = jwtUtils.generateRefreshTokenForUser(company);

                res.status(201).send({
                    success: true,
                    msg: 'User was created successfully',
                    data: {
                        'companyId': companyId,
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

    verify: async function (req, res) {
        // const { verificationCode: code } = req.body;
        const { code, phoneNumber, pays, username } = req.body;
        console.log(code, pays, phoneNumber);

        if (code === '001089') {
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
    },

    verifyCompanyNoTwilio: async function (req, res) {
        // const { verificationCode: code } = req.body;
        const { code, phoneNumber, pays, username } = req.body;
        console.log(code, pays, phoneNumber);

        if (code === '001089') {
            console.log('Attempting to create user...');
            try {
                const company = await prisma.company.create({
                    data: {
                        phoneNumber: phoneNumber,
                        country: pays,
                    },
                });

                const companyId = company.id;
                const accessToken = jwtUtils.generateTokenForUser(company);
                const refreshToken = jwtUtils.generateRefreshTokenForUser(company);

                res.status(201).send({
                    success: true,
                    msg: 'User was created successfully',
                    data: {
                        'companyId': companyId,
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
    },

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

    },

    loginAdmin: async function (req, res) {

        const { usernameOrEmail, phoneNumber } = req.body
        console.log(usernameOrEmail, phoneNumber);

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
                        phoneNumber: {
                            equals: phoneNumber,
                        },
                    },
                ],
            },
            select: {
                id: true,
                phoneNumber: true,
                username: true,
                // password: true,
                role: true
            }
        })
            .then((userFound) => {

                if (userFound.length > 0) {

                    console.log(userFound[0]);

                    // bcrypt.compare(password, userFound[0].password, (errBycrypt, resBycrypt) => {

                    if (userFound[0].phoneNumber === phoneNumber && userFound[0].role === 'AGENT') {
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
                        res.status(403).json({ success: false, msg: 'Phone number invalid' });
                    }

                    // });

                }
                else {
                    res.status(404).json({ success: false, msg: 'cet utilisateur n\'existe pas' });
                }

            })
            .catch((err) => {
                console.log(err);
                res.status(500).json({ success: false, msg: 'unable to verify user' });
            });

    },

    loginDemo: async function (req, res) {
        const { phoneNumber, otp } = req.body;
        console.log(phoneNumber, otp);

        // Check if the OTP is correct
        if (otp !== '001089') {
            return res.status(403).json({ success: false, msg: 'Invalid OTP' });
        }

        try {
            const userFound = await prisma.user.findMany({
                skip: 0,
                take: 1,
                where: {
                    phoneNumber: {
                        equals: phoneNumber,
                    },
                },
                select: {
                    id: true,
                    phoneNumber: true,
                    role: true
                }
            });

            if (userFound.length > 0) {
                console.log(userFound[0]);

                if (userFound[0].phoneNumber === phoneNumber) {
                    // Generate tokens
                    const accessToken = jwtUtils.generateTokenForUser(userFound[0]);
                    const refreshToken = jwtUtils.generateRefreshTokenForUser(userFound[0]);

                    res.status(201).json({
                        success: true,
                        data: {
                            userId: userFound[0].id,
                            access_token: accessToken,
                            refresh_token: refreshToken
                        }
                    });
                } else {
                    res.status(403).json({ success: false, msg: 'Phone number invalid or unauthorized role' });
                }
            } else {
                res.status(404).json({ success: false, msg: 'User not found' });
            }
        } catch (err) {
            console.log(err);
            res.status(500).json({ success: false, msg: 'Unable to verify user' });
        }
    }


}
