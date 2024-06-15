const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { myS3Client } = require('../Utils/s3Client');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

module.exports = {
    getAll: async (req, res) => {
        const { category, companyId } = req.params;
        const { page = 1, pageSize = 10 } = req.query;
        const skip = (page - 1) * pageSize;

        try {
            const annonces = await prisma.annonce.findMany({
                skip: parseInt(skip),
                take: parseInt(pageSize),
                where: {
                    companyId: parseInt(companyId),
                    isVerified: true,
                },
                select: {
                    id: true,
                    nom: true,
                    prix: true,
                    points: true,
                    image: true,
                    description: true,
                    isAvailable: true,
                    category: true,
                    /* company: {
                        select: {
                            id: true,
                            phoneNumber: true,
                            username: true,
                            email: true,
                            logo: true,
                            country: true,
                            city: true,
                        }
                    }, */
                    likes: {
                        select: {
                            id: true,
                            userId: true,
                            createdAt: true,
                            /* user: {
                                select: {
                                    id: true,
                                }
                            } */
                        }
                    }
                }
            });

            res.status(200).json({ annonces });
        } catch (error) {
            console.error('Error fetching annonces:', error);
            res.status(500).json({ error: 'An error occurred while fetching annonces' });
        }
    },

    getAllAnnonces: async (req, res) => {
        const { page = 1, pageSize = 10 } = req.query;
        const skip = (page - 1) * pageSize;
    
        try {
            const totalRows = await prisma.annonce.count();
            const annonces = await prisma.annonce.findMany({
                skip: parseInt(skip),
                take: parseInt(pageSize),
                select: {
                    id: true,
                    nom: true,
                    prix: true,
                    points: true,
                    image: true,
                    description: true,
                    isAvailable: true,
                    category: true,
                    company: {
                        select: {
                            id: true,
                            phoneNumber: true,
                            username: true,
                            email: true,
                            logo: true,
                            country: true,
                            city: true,
                        }
                    },
                }
            });
    
            const totalPages = Math.ceil(totalRows / pageSize);
    
            res.status(200).json({
                annonces,
                currentPage: page,
                totalPages,
                totalRows,
                pageSize,
            });
        } catch (error) {
            console.error('Error fetching annonces:', error);
            res.status(500).json({ error: 'An error occurred while fetching annonces' });
        }
    }, 

    getAllGifts: async (req, res) => {
        // const { category, companyId } = req.params;
        const { page = 1, pageSize = 10 } = req.query;
        const skip = (page - 1) * pageSize;
        const { city } = req.query;

        try {
            const currentUser = await prisma.user.findUnique({
                where: {
                    id: req.user.id,
                },
                select: {
                    pays: true,
                },
            });

            const country = currentUser.pays || null;

            const whereClause = {
                company: { category: "cadeau" },
                ...(country && {
                    company: {
                        country: {
                            contains: country,
                            mode: 'insensitive'
                        }
                    }
                }),
                ...(city && {
                    company: {
                        city: {
                            contains: city,
                            mode: 'insensitive'
                        }
                    }
                })
            };

            const totalRows = await prisma.annonce.count({
                where: whereClause
            });

            const gifts = await prisma.annonce.findMany({
                skip: parseInt(skip),
                take: parseInt(pageSize),
                where: whereClause,
                select: {
                    id: true,
                    nom: true,
                    prix: true,
                    points: true,
                    image: true,
                    description: true,
                    isAvailable: true,
                    category: true,
                    company: {
                        select: {
                            id: true,
                            phoneNumber: true,
                            username: true,
                            email: true,
                            logo: true,
                            country: true,
                            city: true,
                        }
                    },
                    likes: {
                        select: {
                            id: true,
                            userId: true,
                            createdAt: true,
                            /* user: {
                                select: {
                                    id: true,
                                }
                            } */
                        }
                    }
                }
            });

            const totalPage = Math.ceil(totalRows / pageSize);

            res.status(200).json({
                gifts,
                page: page,
                limit: pageSize,
                totalRows: totalRows,
                totalPage: totalPage,
            });
        } catch (error) {
            console.error('Error getting gifts:', error);
            res.status(500).json({ error: 'Failed to get gifts' });
        }
    },

    getAllGiftsByCategory: async (req, res) => {
        const { category } = req.params;
        console.log("Attempting to fetch gifts by category...", category);
        const { page = 1, pageSize = 10 } = req.query;
        const skip = (page - 1) * pageSize;

        try {
            const currentUser = await prisma.user.findUnique({
                where: {
                    id: req.user.id,
                },
                select: {
                    pays: true,
                },
            });

            const country = currentUser.pays || null;

            const whereClause = {
                category: category,
                ...(country && {
                    company: {
                        country: {
                            contains: country,
                            mode: 'insensitive'
                        }
                    }
                }),
            };

            const gifts = await prisma.annonce.findMany({
                skip: parseInt(skip),
                take: parseInt(pageSize),
                where: whereClause,
                select: {
                    id: true,
                    nom: true,
                    prix: true,
                    points: true,
                    image: true,
                    description: true,
                    isAvailable: true,
                    category: true,
                    /* company: {
                        select: {
                            id: true,
                            phoneNumber: true,
                            username: true,
                            email: true,
                            logo: true,
                            country: true,
                            city: true,
                        }
                    }, */
                    likes: {
                        select: {
                            id: true,
                            userId: true,
                            createdAt: true,
                            /* user: {
                                select: {
                                    id: true,
                                }
                            } */
                        }
                    }
                }
            });

            res.status(200).json({ gifts });
        } catch (error) {
            console.error('Error getting gifts:', error);
            res.status(500).json({ error: 'Failed to get gifts' });
        }
    },

    getOne: async (req, res) => {
        try {
            const { id } = req.params;

            const carte = await prisma.carte.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    name: true,
                    email: true,
                    mapAddress: true,
                    description: true,
                    location: true,
                    OpenDaysTime: true,
                    countryId: true,
                    cityId: true,
                    image: true,
                    country: {
                        select: {
                            name: true,
                            sigle: true,
                        }
                    },
                    city: {
                        select: {
                            name: true,
                        }
                    },
                    typeCarte: true,
                    companyId: true,
                    company: {
                        select: {
                            username: true,
                            phoneNumber: true,
                            logo: true,
                            mapAddress: true,
                        }
                    },
                    createdAt: true,
                    updatedAt: true,
                },
            });

            const statusCode = carte ? 200 : 404;
            const response = carte || { message: `Cannot find carte with id = ${id}` };
            res.status(statusCode).send(response);
        } catch (error) {
            res.status(500).send({
                message: error.message || `Some error occurred while retrieving the carte with id=${id}`,
            });
        }
    },

    searchCarte: async function (req, res) {
        const { inputvalue } = req.body;

        try {
            const data = await prisma.carte.findMany({
                where: {
                    OR: [
                        { name: inputvalue, },
                        { email: inputvalue, },
                        { description: inputvalue, },
                        { location: inputvalue, },
                    ],
                },
                orderBy: { createdAt: 'desc' }
            })

            res.json({ data });

        } catch (error) {
            console.error('Error occurred while querying cartes table:', error);
            res.status(500).json({ error: 'An error occurred' });
        }

    },

    createAnnonce: async (req, res) => {
        console.log("Creating new annonce...");
        console.log("New gift details:", req.body);

        const { nom, prix, category, description, points } = req.body;
        const { id } = req.company;

        // Handle image upload to S3
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const { filename, path } = file;

        try {
            // const randomString = Math.random().toString(36).substring(2, 15) /** + Math.random().toString(36).substring(2, 15)*/;
            const uploadParams = {
                Bucket: 'annonce.dmvision-bucket',
                Key: `annonces/${filename}`,
                Body: fs.createReadStream(path),
                ContentType: file.mimetype,
            };

            try {
                const uploadResponse = await myS3Client.send(new PutObjectCommand(uploadParams));
                console.log(`Successfully uploaded Annonce image to S3: ${uploadParams.Key}`);
            } catch (err) {
                console.error('Error uploading Annonce image to S3:', err);
                return res.status(500).json({ error: 'Error uploading Gift image to S3' });
            }

            const imageUrl = `https://s3.eu-west-2.amazonaws.com/${uploadParams.Bucket}/${uploadParams.Key}`;

            // Creating the gift in the DB
            const newAnnonce = await prisma.annonce.create({
                data: {
                    nom: nom,
                    category: category,
                    description: description,
                    prix: parseFloat(prix),
                    points: parseFloat(points),
                    image: imageUrl,
                    companyId: id,
                },
            });

            console.log("Annonce successfully created", newAnnonce);
            return res.status(200).json({ success: true, newAnnonce });
        } catch (error) {
            console.error('Error creating annonce:', error);
            return res.status(500).json({ error: 'Failed to create annonce' }); // Internal server error
        }
    },

    getAllAnnoncesByCompany: async (req, res) => {
        console.log("Getting all annonces for this company...");
        try {
            const { id } = req.company;
            const limit = parseInt(req.query.limit) || 10;
            const page = parseInt(req.query.page) || 1;

            const offset = (page - 1) * limit;

            const annonces = await prisma.annonce.findMany({
                where: {
                    companyId: id,
                },
                include: {
                    company: true,
                    reservations: true,
                    likes: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: offset,
                take: limit,
            });

            // Total number of annonces associated with the company
            const totalAnnonces = await prisma.annonce.count({
                where: {
                    companyId: id,
                },
            });

            // Total number of pages
            const totalPages = Math.ceil(totalAnnonces / limit);

            return res.status(200).json({
                success: true,
                annonces: annonces,
                currentPage: page,
                totalPages: totalPages,
                totalAnnonces: totalAnnonces,
            });
        } catch (error) {
            console.error('Error retrieving annonces for this company:', error);
            return res.status(500).json({ error: 'Failed to retrieve annonces for the company' });
        }
    },

    getCompanyReservations: async (req, res) => {
        console.log("Getting reservations for this company...");
        try {
            const { id } = req.company;
            const limit = parseInt(req.query.limit) || 10;
            const page = parseInt(req.query.page) || 1;

            const offset = (page - 1) * limit;

            const reservations = await prisma.reservation.findMany({
                where: {
                    annonce: {
                        company: {
                            id: id
                        }
                    }
                },
                include: {
                    user: true,
                    annonce: true
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: offset,
                take: limit,
            });

            // Total number of reservations associated with the company
            const totalReservations = await prisma.reservation.count({
                where: {
                    annonce: {
                        company: {
                            id: id
                        }
                    }
                },
            });

            // Total number of pages
            const totalPages = Math.ceil(totalReservations / limit);

            return res.status(200).json({
                success: true,
                reservations: reservations,
                currentPage: page,
                totalPages: totalPages,
                totalReservations: totalReservations,
            });
        } catch (error) {
            console.error('Error retrieving reservations for this company:', error);
            return res.status(500).json({ error: 'Failed to retrieve reservations for the company' });
        }
    },


    getPresignedUrl: async (req, res) => {
        const { photoURL } = req.body;
        console.log('URL for presignedURL: ', photoURL);

        // Determine the bucket dynamically
        const bucketPrefix = photoURL.includes('annonce.dmvision-bucket') ? 'annonce.dmvision-bucket' : 'user.dmvision-bucket';

        const objectParams = {
            Bucket: bucketPrefix,
            Key: photoURL.replace(`https://s3.eu-west-2.amazonaws.com/${bucketPrefix}/`, ''),
        }

        const expirationTime = 60 * 60 * 12;
        const createPresignedUrlWithClient = () => {
            const client = myS3Client;
            const command = new GetObjectCommand(objectParams);
            return getSignedUrl(client, command, { expiresIn: expirationTime });
        }

        try {
            const photoPresignedURL = await createPresignedUrlWithClient({
                // region: objectParams.Region,
                bucket: objectParams.Bucket,
                key: objectParams.Key
            });
            // console.log("Presigned URL with client", photoPresignedURL);

            res.status(200).json({ success: true, url: photoPresignedURL });
        } catch (error) {
            console.error(error);
        }
    },

    makeReservation: async (req, res) => {
        try {
            console.log("Making new reservation...");
            console.log("New reservation details:", req.body);

            const { annonceId, quantity, userId } = req.body;

            // Calculate the endDate (30 days from startDate)
            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 30);

            const reference = uuidv4().slice(0, 8);

            const newReservation = await prisma.reservation.create({
                data: {
                    annonce: { connect: { id: parseInt(annonceId) } },
                    quantity: parseInt(quantity),
                    startDate: new Date(),
                    endDate: endDate,
                    user: { connect: { id: parseInt(userId) } },
                    reference: reference,
                },
            });

            console.log("Reservation successfully created", newReservation);
            res.status(200).json({ success: true, newReservation });
        } catch (error) {
            console.error('Error creating reservation:', error);
            res.status(500).json({ error: 'Failed to create reservation' });
        }
    },

    getUserReservations: async (req, res) => {
        const { userId } = req.params;

        try {
            const reservations = await prisma.reservation.findMany({
                where: {
                    userId: parseInt(userId),
                },
                include: {
                    annonce: {
                        select: {
                            nom: true,
                            image: true,
                            prix: true,
                            points: true,
                            description: true,
                            category: true,
                            company: {
                                select: {
                                    id: true,
                                    username: true,
                                }
                            }
                        },
                    },
                },
            });

            console.log(`Found ${reservations.length} reservations for user ID ${userId}`);
            res.status(200).json(reservations);
        } catch (error) {
            console.error('Error fetching purchases:', error);
            res.status(500).json({ error: 'Failed to fetch reservations' });
        }
    },

    deleteCarte: async (req, res) => {

        const { id } = req.params
        try {
            const deleteCarte = await prisma.carte.delete({
                where: {
                    id: parseInt(id),
                },
            })

            const statusCode = deleteCarte ? 200 : 404;
            const response = deleteCarte || { message: `Cannot delete carte with id = ${id}` };
            res.status(statusCode).send(response);
        } catch (error) {
            res.status(500).send({
                message: error.message || `Some error occurred while deleting the carte with id=${id}`,
            });
        }
    },

    addNewPhotoCarte: async (req, res) => {
        const { name, path_url, carteId } = req.body;
        console.log("Attempting to add new photo to carte:", { name, path_url, carteId });

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const { filename, path } = file;

        try {

            const uploadParams = {
                Bucket: 'carte.toloveapp-storage',
                Key: `carte${carteId}/${filename}`,
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

            // Create a new carte photo in the database
            const newPhotoCarte = await prisma.carteOthersPhoto.create({
                data: {
                    name: name,
                    path_url: imageUrl,
                    carteId: carteId
                },
            });

            return res.status(201).send({ success: true, msg: 'Carte photo has been added successfully', carte: newPhotoCarte });
        } catch (error) {
            console.error('Error while adding carte photo:', error);
            res.status(500).json({ success: false, error: "Failed to add carte photo" });
        }
    },

    getCarteOtherPhotos: async (req, res) => {
        try {
            const { id } = req.params;

            const photos = await prisma.carteOthersPhoto.findMany({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    name: true,
                    path_url: true,
                    carteId: {
                        name: true,
                        email: true,
                        mapAddress: true,
                    },
                    createdAt: true,
                    updatedAt: true,
                },
            });

            res.status(200).send(photos);
        } catch (error) {
            res.status(500).send({
                message: error.message || `An error occurred`,
            });
        }
    },

    likeCarte: async function (req, res) {
        const { userId, carteId } = req.body;
        console.log("Attempting to like carte:", { userId, carteId });

        try {
            // Check if current user has already like this carte
            const checkingLike = await prisma.likedCarte.findFirst({
                where: {
                    userId: userId,
                    carteId: carteId
                },
            });

            if (checkingLike) {
                return res.status(422).send({ success: false, msg: 'This carte has already been liked by this user' });
            }

            // Create a new carte like entry in the database
            const newLikedCarte = await prisma.likedCarte.create({
                data: {
                    userId: userId,
                    carteId: carteId,
                },
            });

            const updateCarteLikes = await prisma.carte.update({
                where: {
                    id: carteId
                },
                data: {
                    likes: {
                        create: {
                            userId: userId,
                            carteId: carteId,
                        }
                    }
                }
            });

            return res.status(201).send({ success: true, msg: 'Carte has been liked successfully', like: newLikedCarte });
        } catch (error) {
            console.error('Error while adding a like to carte:', error);
            res.status(500).json({ success: false, error: "Failed to add carte like" });
        }
    },

    unLikeCarte: async function (req, res) {
        const { userId, carteId } = req.body;
        console.log("Attempting to unlike carte:", { userId, carteId });

        try {
            // Check if current user has already like this carte
            const checkingLike = await prisma.likedCarte.findFirst({
                where: {
                    userId: userId,
                    carteId: carteId
                },
            });

            if (!checkingLike) {
                return res.status(422).send({ success: false, msg: 'This user never like this carte' });
            }

            // Remove a carte like entry from the database
            const removeLike = LikedCarte.deleteMany({
                where: {
                    userId: parseInt(userId),
                    carteId: parseInt(carteId),
                },
            })

            prisma
                .$transaction([removeLike])
                .then(() => {
                    res.status(200).send({
                        message: 'Carte Like has been deleted successfully',
                    })
                })
                .catch((error) => {
                    res.status(500).send({
                        message: error.message || `Some error occurred while deleting the carte like`,
                    })
                })

        } catch (error) {
            console.error('Error while removing a like to carte:', error);
            res.status(500).json({ success: false, error: "Failed to remove carte like" });
        }
    },

    checkCarteLike: async (req, res) => {
        // CHECKING
        const { userId, carteId } = req.body;

        try {
            const checking = await prisma.likedCarte.findFirst({
                where: {
                    userId: userId,
                    carteId: carteId,
                },
                select: {
                    id: true,
                    userId: true,
                    carteId: true,
                }
            });

            let statusCode;
            let response;

            if (checking) {
                statusCode = 201;
                response = { success: true, msg: 'This carte is been liked by this user', checking: true };
            } else {
                statusCode = 500;
                response = { message: `This user never like this carte` };
            }

            // RETURN THE APROPRIATED RESPONSE
            return res.status(statusCode).send(response);

        } catch (error) {
            res.status(500).send({
                message: error.message || `An error occurred`,
            });
        }
    },

    /* makeReservation: async (req, res) => {

        const { userId, carteId, startDate, endDate } = req.body;
        console.log("Attempting to make reservation carte:", { userId, carteId, startDate, endDate });

        try {
            // Check if current user has already like this carte
            const checkingReservation = await prisma.carteReservation.findFirst({
                where: {
                    userId: userId,
                    carteId: carteId,
                    startDate: startDate,
                    endDate: endDate
                },
            });

            if (checkingReservation) {
                return res.status(422).send({ success: false, msg: 'This carte has already been reserved by this user at this time' });
            }

            // Create a new carte like entry in the database
            const newReservation = await prisma.carteReservation.create({
                data: {
                    userId: userId,
                    carteId: carteId,
                    startDate: startDate,
                    endDate: endDate
                },
            });

            const updateCarteReservations = await prisma.carte.update({
                where: {
                    id: carteId
                },
                data: {
                    reservations: {
                        create: {
                            userId: userId,
                            carteId: carteId,
                            startDate: startDate,
                            endDate: endDate
                        }
                    }
                }
            });

            return res.status(201).send({ success: true, msg: 'Carte has been reserved successfully', reservation: newReservation });
        } catch (error) {
            console.error('Error while reserving the carte:', error);
            res.status(500).json({ success: false, error: "Failed to make carte reservation" });
        }
    }, */

    skipReservation: async (req, res) => {

        const { userId, carteId } = req.body;
        console.log("Attempting to skip reservation carte:", { userId, carteId });

        try {

            // Skip a carte reservation entry from the database
            const reservationSkip = carteReservation.deleteMany({
                where: {
                    userId: parseInt(userId),
                    carte: { userId: parseInt(userId) }
                },
            })

            prisma
                .$transaction([reservationSkip])
                .then(() => {
                    res.status(200).send({
                        message: 'Carte Reservation has been deleted successfully',
                    })
                })
                .catch((error) => {
                    res.status(500).send({
                        message: error.message || `Some error occurred while deleting the carte reservation`,
                    })
                })

        } catch (error) {
            console.error('Error while removing a reservation to carte:', error);
            res.status(500).json({ success: false, error: "Failed to remove carte reservation" });
        }

    },
}