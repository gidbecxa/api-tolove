const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { myS3Client } = require('../Utils/s3Client');
const fs = require('fs');

module.exports = {
    getAll: async (req, res) => {
        console.log(`Query: limit: ${req.query.limit}, page: ${req.query.page}`);
        const limit = parseInt(req.query.limit) || 3;
        const page = parseInt(req.query.page) || 0;

        try {
            const totalRows = await prisma.carte.count();

            const cartes = await prisma.carte.findMany({
                skip: limit * page,
                take: limit,
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
                orderBy: {
                    id: 'desc',
                },
            });

            const totalPage = Math.ceil(totalRows / limit);

            res.status(200).json({
                result: cartes,
                page: page,
                limit: limit,
                totalRows: totalRows,
                totalPage: totalPage
            });
        } catch (error) {
            res.status(500).send({
                message: error.message || `An error occurred`,
            });
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
                orderBy: {createdAt: 'desc'}
            })

            res.json({ data });
            
        } catch (error) {
            console.error('Error occurred while querying cartes table:', error);
            res.status(500).json({ error: 'An error occurred' });
        }

    },

    addCarte: async function (req, res) {
        const { name, email, mapAddress, description, location, OpenDaysTime, countryId, cityId, typeCarte, companyId } = req.body;
        console.log("Attempting to add carte:", { name, email, mapAddress, description, location, OpenDaysTime, countryId, cityId, typeCarte, companyId });

         // Check if current company has the appropriated Subscription to add this Carte
         const checking = await prisma.companySubscription.findFirst({
            where: {
                companyId: companyId,
                subscription: { status: typeCarte },
            },
        });

        if (!checking) {
            return res.status(422).send({ success: false, msg: 'Sorry, this Company don\'t have access the current Subscription' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const { filename, path } = file;

        try {

            const uploadParams = {
                Bucket: 'carte.toloveapp-storage',
                Key: `carte${companyId}/${filename}`,
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

            // Create a new carte in the database
            const newCarte = await prisma.carte.create({
                data: {
                    name: name,
                    email: email,
                    description: description,
                    location: location,
                    OpenDaysTime: OpenDaysTime,
                    countryId: countryId,
                    cityId: cityId,
                    image: imageUrl,
                    typeCarte: typeCarte,
                    companyId: companyId,
                },
            });

            return res.status(201).send({ success: true, msg: 'Carte has been added successfully', carte: newCarte });
        } catch (error) {
            console.error('Error while adding carte:', error);
            res.status(500).json({ success: false, error: "Failed to add carte" });
        }
    },

    updateCarte: async (req, res) => {

        const { id } = req.params;
        const { name, email, mapAddress, description, location, OpenDaysTime, countryId, cityId, typeCarte } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded', msg: 'No file uploaded'  });
        }

        const file = req.file;
        const { filename, path } = file;

        try {
            const uploadParams = {
                Bucket: 'carte.toloveapp-storage',
                Key: `carte${id}/${filename}`,
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

            const carte = await prisma.carte.update({
                where: { id: parseInt(id) },
                data: {
                    name: name,
                    email: email,
                    description: description,
                    location: location,
                    OpenDaysTime: OpenDaysTime,
                    countryId: countryId,
                    cityId: cityId,
                    image: imageUrl,
                    typeCarte: typeCarte,
                },
            });

            res.status(200).json({ success: true, carte })
        } catch (error) {
            console.error("Error updating carte infos: ", error);
            res.status(500).json({ success: false, error: "Failed to update carte infos" })
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

            if(checking) {
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

    makeReservation: async (req, res) => {

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
    },

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