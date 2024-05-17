const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const { PutObjectCommand, GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { myS3Client } = require('../Utils/s3Client');
const fs = require('fs');
const jwtUtils = require("../Utils/jwt.utils");

module.exports = {
    getAll: async (req, res) => {
        console.log(`Query: limit: ${req.query.limit}, page: ${req.query.page}`);
        const limit = parseInt(req.query.limit) || 8;
        const page = parseInt(req.query.page) || 0;

        try {
            const totalRows = await prisma.company.count();

            const companies = await prisma.company.findMany({
                skip: limit * page,
                // skip: totalRows - (limit * (page + 1)),  // Start fetching the users from the last row and move backward in the result set
                take: limit,
                select: {
                    id: true,
                    username: true,
                    birthday: true,
                    description: true,
                    genre: true,
                    photoProfil: true,
                    pays: true,
                    subscriptionId: true,
                },
                orderBy: {
                    id: 'desc',
                },
            });

            const totalPage = Math.ceil(totalRows / limit);

            res.status(200).json({
                result: companies,
                page: page,
                limit: limit,
                totalRows: totalRows,
                totalPage: totalPage
            });
        } catch (error) {
            res.status(500).send({
                message: error.message || 'Some error occurred while retrieving companies',
            })
        }
    },

    getCompaniesAnnonces: async (req, res) => {
        console.log(`Query: limit: ${req.query.limit}, page: ${req.query.page}`);
        const limit = parseInt(req.query.limit) || 8;
        const page = parseInt(req.query.page) || 0;
        const { category } = req.params;

        try {
            const totalRows = await prisma.company.count({
                where: {
                    category: category,
                }
            });

            const companies = await prisma.company.findMany({
                where: {
                    category: category
                },
                skip: limit * page,
                take: limit,
                select: {
                    id: true,
                    phoneNumber: true,
                    username: true,
                    email: true,
                    category: true,
                    logo: true,
                    description: true,
                    country: true,
                    city: true,
                    // location: true,
                    // mapAddress: true,
                    // subscriptionId: true,
                    /* annonces: {
                        select: {
                            id: true,
                            nom: true,
                            prix: true,
                            points: true,
                            image: true,
                            description: true,
                            category: true,
                            isAvailable: true,
                            createdAt: true,
                            expiresIn: true,
                            companyId: true,
                        },
                    }, */
                },
                orderBy: {
                    id: 'desc',
                },
            });

            const totalPage = Math.ceil(totalRows / limit);

            res.status(200).json({
                result: companies,
                page: page,
                limit: limit,
                totalRows: totalRows,
                totalPage: totalPage,
            });
        } catch (error) {
            res.status(500).send({
                message: error.message || 'Some error occurred while retrieving companies',
            });
        }
    },


    getMe: async (req, res) => {

        let { isOnline, ...mics } = req.company;

        res.status(200).send({
            success: true,
            data: mics
        })
    },

    getOne: async (req, res) => {
        try {
            const { id } = req.params;

            const company = await prisma.company.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    username: true,
                    phoneNumber: true,
                    birthday: true,
                    langage: true,
                    genre: true,
                    hobbies: true,
                    description: true,
                    photoProfil: true,
                    pays: true,
                    villes: true,
                },
            });

            const statusCode = company ? 200 : 404;
            const response = company || { message: `Cannot find company with id = ${id}` };
            res.status(statusCode).send(response);
        } catch (error) {
            res.status(500).send({
                message: error.message || `Some error occurred while retrieving the company with id=${id}`,
            });
        }
    },

    getLogo: async (req, res) => {
        const { id } = req.params;

        try {
            const company = await prisma.company.findUnique({
                where: {
                    id: parseInt(id),
                },
                select: {
                    logo: true,
                },
            });

            if (!company || !company.logo) {
                return res.status(404).json({ success: false, error: "The Company or her logo not found" });
            }

            const logoUrl = company.logo;

            const objectParams = {
                Bucket: 'company.toloveapp-storage',
                Key: logoUrl.replace(`https://s3.eu-west-2.amazonaws.com/company.toloveapp-storage/`, ''),
            }
            // console.log(objectParams);

            const createPresignedUrlWithClient = () => {
                const client = myS3Client;
                const command = new GetObjectCommand(objectParams);
                return getSignedUrl(client, command, { expiresIn: 21600 });
            }

            try {
                const logooPresignedURL = await createPresignedUrlWithClient({
                    // region: objectParams.Region,
                    bucket: objectParams.Bucket,
                    key: objectParams.Key
                });
                // console.log("Presigned URL with client");

                res.status(200).json({ success: true, url: logooPresignedURL });
            } catch (error) {
                console.error(error);
            }
        } catch (error) {
            console.error("Error fetching logo: ", error);
            res.status(500).json({ success: false, error: "Failed to fetch logo" });
        }
    },

    getLogoWithUrl: async (req, res) => {
        const { logooURL } = req.body;
        console.log('URL for presignedURL: ', logooURL);

        const objectParams = {
            Bucket: 'company.toloveapp-storage',
            Key: logooURL.replace(`https://s3.eu-west-2.amazonaws.com/company.toloveapp-storage/`, ''),
        }

        const expirationTime = 60 * 60 * 12;
        const createPresignedUrlWithClient = () => {
            const client = myS3Client;
            const command = new GetObjectCommand(objectParams);
            return getSignedUrl(client, command, { expiresIn: expirationTime });
        }

        try {
            const logooPresignedURL = await createPresignedUrlWithClient({
                // region: objectParams.Region,
                bucket: objectParams.Bucket,
                key: objectParams.Key
            });

            res.status(200).json({ success: true, url: logooPresignedURL });
        } catch (error) {
            console.error(error);
        }
    },

    register: async function (req, res) {
        const { phoneNumber } = req.body;
        console.log('Registering company...', phoneNumber);

        try {
            const response = await prisma.company.findMany({
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
                /* verificationRequest = await twilio.verify.v2.services(VERIFICATION_SID)
                    .verifications
                    .create({ to: phoneNumber, channel: 'sms' }); */

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

        // logger.debug(verificationRequest);
    },

    verify: async function (req, res) {
        // const { verificationCode: code } = req.body;
        const { code, phoneNumber, pays } = req.body;
        console.log(code, phoneNumber);

        if (code === '001089') {
            console.log('Attempting to create company...');
            try {
                const company = await prisma.company.create({
                    data: {
                        phoneNumber: phoneNumber,
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
                    msg: error.message || 'Some error occurred while creating the company',
                });
                console.log(error);
            }
        }
    },

    login: async function (req, res) {

        const { usernameOrEmail, password } = req.body

        await prisma.company.findMany({
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

    updateFirstProfileData: async (req, res) => {
        const { id } = req.company;
        // console.log('id: ', id);
        const { username, category, email, city, numeroSocial, } = req.body;
        console.log('Request body ', req.body);

        try {
            const user = await prisma.company.update({
                where: { id: parseInt(id) },
                data: {
                    username: username,
                    category: category,
                    email: email,
                    city: city,
                    numeroSocial: numeroSocial,
                },
            });

            res.status(200).json({ success: true, user })
        } catch (error) {
            console.error("Error updating user: ", error);
            res.status(500).json({ success: false, error: "Failed to update user" })
        }
    },

    updateSolde: async function (req, res) {

        const { id } = req.params;
        const { solde } = req.body;
        console.log('Body:', req.body);

        prisma.company.update({
            where: {
                id: parseInt(id),
            },
            data: {
                solde: solde,
            },
        })
            .then(() => {
                res.status(200).send({
                    message: 'Coins was updated successfully',
                })
            })
            .catch((error) => {
                res.status(500).send({
                    message: error.message || `Some error occurred while updating the coins with id=${id}`,
                })
            })
    },

    updateProfilLastData: async (req, res) => {
        const { id } = req.company;
        console.log('Update data step 2 for company ', id);
        // console.log('Request body ', req.body);
        const { description } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded', msg: 'No file uploaded' });
        }

        const file = req.file;
        const { filename, path } = file;

        try {
            const uploadParams = {
                Bucket: 'user.dmvision-bucket',
                Key: `company${id}/${filename}`,
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

            const user = await prisma.company.update({
                where: { id: parseInt(id) },
                data: {
                    logo: imageUrl,
                    description: description,
                },
            });

            res.status(200).json({ success: true, user })
        } catch (error) {
            console.error("Error updating user: ", error);
            res.status(500).json({ success: false, error: "Failed to update user" })
        }
    },

    uploadLogo: async function (req, res) {
        const { id } = req.params

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const { filename, path } = file;

        const uploadParams = {
            Bucket: 'company.toloveapp-storage',
            Key: `company${id}/${filename}`,
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

        const logoUrl = `https://s3.eu-west-2.amazonaws.com/${uploadParams.Bucket}/${uploadParams.Key}`;

        res.status(200).send({
            message: 'Logo URL was updated successfully',
            logoUrl: logoUrl,
        })
    },

    getProfilePhoto: async (req, res) => {
        const { id } = req.params;

        try {
            const user = await prisma.company.findUnique({
                where: {
                    id: parseInt(id),
                },
                select: {
                    logo: true,
                },
            });

            if (!user || !user.logo) {
                return res.status(404).json({ success: false, error: "User or profile photo not found" });
            }

            const photoProfilUrl = user.photoProfil;

            const objectParams = {
                Bucket: 'user.dmvision-bucket',
                Key: photoProfilUrl.replace(`https://s3.eu-west-2.amazonaws.com/user.dmvision-bucket/`, ''),
            }
            // console.log(objectParams);

            const createPresignedUrlWithClient = () => {
                const client = myS3Client;
                const command = new GetObjectCommand(objectParams);
                return getSignedUrl(client, command, { expiresIn: 21600 });
            }

            try {
                const photoPresignedURL = await createPresignedUrlWithClient({
                    // region: objectParams.Region,
                    bucket: objectParams.Bucket,
                    key: objectParams.Key
                });
                // console.log("Presigned URL with client");

                res.status(200).json({ success: true, url: photoPresignedURL });
            } catch (error) {
                console.error(error);
            }
        } catch (error) {
            console.error("Error fetching profile photo: ", error);
            res.status(500).json({ success: false, error: "Failed to fetch profile photo" });
        }
    },

    subscribeCompany: async (req, res) => {
        const { companyId, subscriptionId, } = req.body;
        console.log("Attempting to subcribe to a carte:", { companyId, subscriptionId, });

        try {
            // Check if current company has already subscribe to this Subscription
            const checkingSubscription = await prisma.companySubscription.findFirst({
                where: {
                    companyId: companyId,
                    subscriptionId: subscriptionId,
                },
            });

            if (checkingSubscription) {
                return res.status(422).send({ success: false, msg: 'This company has already subscribed to this subscription' });
            }

            // Create a new carte in the database
            const newSubscription = await prisma.companySubscription.create({
                data: {
                    companyId: companyId,
                    subscriptionId: subscriptionId,
                },
            });

            return res.status(201).send({ success: true, msg: 'Subscription has been made successfully', carte: newSubscription });
        } catch (error) {
            console.error('Error while making subscription:', error);
            res.status(500).json({ success: false, error: "Failed to make subscription" });
        }
    },

    unSubscribeCompany: async (req, res) => {
        const { id } = req.params
        try {
            const deleteSubscription = await prisma.subscription.delete({
                where: {
                    id: parseInt(id),
                },
            })

            const statusCode = deleteSubscription ? 200 : 404;
            const response = deleteSubscription || { message: `Cannot delete company subscription with id = ${id}` };
            res.status(statusCode).send(response);
        } catch (error) {
            res.status(500).send({
                message: error.message || `Some error occurred while deleting the company subscription with id=${id}`,
            });
        }
    },

    updateProfile: async (req, res) => {
        const { id } = req.company;
        console.log('Registering company\'s info... ', req.company);
        const { username, email, country, category, city } = req.body;
        // console.log('Request body ', req.body);

        try {
            const user = await prisma.company.update({
                where: { id: parseInt(id) },
                data: {
                    username: username,
                    email: email,
                    country: country,
                    category: category,
                    city: city,
                },
            });

            res.status(200).json({ success: true, user })
        } catch (error) {
            console.error("Error updating user: ", error);
            res.status(500).json({ success: false, error: "Failed to update user" })
        }
    },
}