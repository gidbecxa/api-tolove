const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { myS3Client } = require('../Utils/s3Client');
const fs = require('fs');

module.exports = {
    getAll: async (req, res) => {
        try {
            const restos = await prisma.resto.findMany({
                select: {
                    id: true,
                    name: true,
                    description: true,
                    location: true,
                    OpenDaysTime: true,
                    countryId: true,
                    cityId: true,
                    image: true,
                    country: {
                        name: true,
                        sigle: true,
                    },
                    city: {
                        name: true,
                    },
                    createdAt: true,
                    updatedAt: true,
                },
            });

            res.status(200).send(restos);
        } catch (error) {
            res.status(500).send({
                message: error.message || `An error occurred`,
            });
        }
    },

    getOne: async (req, res) => {
        try {
            const { id } = req.params;

            const resto = await prisma.resto.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    location: true,
                    OpenDaysTime: true,
                    countryId: true,
                    cityId: true,
                    image: true,
                    country: {
                        name: true,
                        sigle: true,
                    },
                    city: {
                        name: true,
                    },
                    createdAt: true,
                    updatedAt: true,
                },
            });

            const statusCode = resto ? 200 : 404;
            const response = resto || { message: `Cannot find resto with id = ${id}` };
            res.status(statusCode).send(response);
        } catch (error) {
            res.status(500).send({
                message: error.message || `Some error occurred while retrieving the resto with id=${id}`,
            });
        }
    },

    searchResto: async function (req, res) {
        const { inputvalue } = req.body;

        try {
            const data = await prisma.resto.findMany({
                where: {
                    OR: [
                        { name: inputvalue, },
                        { name: '%' + inputvalue + '%', },
                        { name: '\\_' + inputvalue, },
                        { description: inputvalue, },
                        { description: '%' + inputvalue + '%', },
                        { location: inputvalue, },
                    ],
                },
                orderBy: {createdAt: 'desc'}
            })

            res.json({ data });
            
        } catch (error) {
            console.error('Error occurred while querying restos table:', error);
            res.status(500).json({ error: 'An error occurred' });
        }

    },

    addResto: async function (req, res) {
        const { name, description, location, OpenDaysTime, countryId, cityId, } = req.body;
        console.log("Attempting to add resto:", { name, description, location, OpenDaysTime, countryId, cityId });

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const { filename, path } = file;

        try {

            const uploadParams = {
                Bucket: 'resto.toloveapp-storage',
                Key: `resto${restoId}/${filename}`,
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

            // Create a new resto in the database
            const newResto = await prisma.resto.create({
                data: {
                    name: name,
                    description: description,
                    location: location,
                    OpenDaysTime: OpenDaysTime,
                    countryId: countryId,
                    cityId: cityId,
                    image: imageUrl,
                },
            });

            return res.status(201).send({ success: true, msg: 'Resto has been added successfully', resto: newResto });
        } catch (error) {
            console.error('Error while adding resto:', error);
            res.status(500).json({ success: false, error: "Failed to add resto" });
        }
    },

    updateResto: async (req, res) => {

        const { id } = req.params;
        const { name, description, location, OpenDaysTime, countryId, cityId, } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded', msg: 'No file uploaded'  });
        }

        const file = req.file;
        const { filename, path } = file;

        try {
            const uploadParams = {
                Bucket: 'resto.toloveapp-storage',
                Key: `resto${id}/${filename}`,
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

            const resto = await prisma.resto.update({
                where: { id: parseInt(id) },
                data: {
                    name: name,
                    description: description,
                    location: location,
                    OpenDaysTime: OpenDaysTime,
                    countryId: countryId,
                    cityId: cityId,
                    image: imageUrl,
                },
            });

            res.status(200).json({ success: true, resto })
        } catch (error) {
            console.error("Error updating resto infos: ", error);
            res.status(500).json({ success: false, error: "Failed to update resto infos" })
        }
    },

    deleteResto: async (req, res) => {

        const { id } = req.params

        const deleteResto = Resto.delete({
            where: {
                id: parseInt(id),
            },
        })

        prisma
            .$transaction([deleteResto])
            .then(() => {
                res.status(200).send({
                    message: 'Resto has been deleted successfully',
                })
            })
            .catch((error) => {
                res.status(500).send({
                    message: error.message || `Some error occurred while deleting the resto with id=${id}`,
                })
            })
    },
    
    likeResto: async function (req, res) {
        const { userId, restoId } = req.body;
        console.log("Attempting to like resto:", { userId, restoId });

        try {
            // Check if current user has already like this resto
            const checkingLike = await prisma.likedResto.findFirst({
                where: {
                    userId: userId,
                    restoId: restoId
                },
            });

            if (checkingLike) {
                return res.status(422).send({ success: false, msg: 'This resto has already been liked by this user' });
            }

            // Create a new resto like entry in the database
            const newLikedResto = await prisma.likedResto.create({
                data: {
                    userId: userId,
                    restoId: restoId,
                },
            });
    
            const updateRestoLikes = await prisma.resto.update({
                where: {
                    id: restoId
                },
                data: {
                    likes: {
                        create: {
                            userId: userId,
                            restoId: restoId,
                        }
                    }
                }
            });

            return res.status(201).send({ success: true, msg: 'Resto has been liked successfully', like: newLikedResto });
        } catch (error) {
            console.error('Error while adding a like to resto:', error);
            res.status(500).json({ success: false, error: "Failed to add resto like" });
        }
    },
      
    unLikeResto: async function (req, res) {
        const { userId, restoId } = req.body;
        console.log("Attempting to unlike resto:", { userId, restoId });

        try {
            // Check if current user has already like this resto
            const checkingLike = await prisma.likedResto.findFirst({
                where: {
                    userId: userId,
                    restoId: restoId
                },
            });

            if (!checkingLike) {
                return res.status(422).send({ success: false, msg: 'This user never like this resto' });
            }

            // Remove a resto like entry from the database
            const removeLike = LikedResto.deleteMany({
                where: {
                    userId: parseInt(userId),
                    restoId: parseInt(restoId),
                },
            })
    
            prisma
                .$transaction([removeLike])
                .then(() => {
                    res.status(200).send({
                        message: 'Resto Like has been deleted successfully',
                    })
                })
                .catch((error) => {
                    res.status(500).send({
                        message: error.message || `Some error occurred while deleting the resto like`,
                    })
                })

        } catch (error) {
            console.error('Error while removing a like to resto:', error);
            res.status(500).json({ success: false, error: "Failed to remove resto like" });
        }
    },
    
    checkRestoLike: async (req, res) => {
        // CHECKING
        const { userId, restoId } = req.body;

        try {
            const checking = await prisma.likedResto.findFirst({
                where: {
                    userId: userId,
                    restoId: restoId,
                },
                select: {
                    id: true,
                    userId: true,
                    restoId: true,
                }
            });

            let statusCode;
            let response;

            if(checking) {
                statusCode = 201;
                response = { success: true, msg: 'This resto is been liked by this user', checking: true };
            } else {
                statusCode = 500;
                response = { message: `This user never like this resto` };
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

        const { userId, restoId, startDate, endDate } = req.body;
        console.log("Attempting to make reservation resto:", { userId, restoId, startDate, endDate });

        try {
            // Check if current user has already like this resto
            const checkingReservation = await prisma.restoReservation.findFirst({
                where: {
                    userId: userId,
                    restoId: restoId,
                    startDate: startDate,
                    endDate: endDate
                },
            });

            if (checkingReservation) {
                return res.status(422).send({ success: false, msg: 'This resto has already been reserved by this user at this time' });
            }

            // Create a new resto like entry in the database
            const newReservation = await prisma.restoReservation.create({
                data: {
                    userId: userId,
                    restoId: restoId,
                    startDate: startDate,
                    endDate: endDate
                },
            });
        
            const updateRestoReservations = await prisma.resto.update({
                where: {
                    id: restoId
                },
                data: {
                    reservations: {
                        create: {
                            userId: userId,
                            restoId: restoId,
                            startDate: startDate,
                            endDate: endDate
                        }
                    }
                }
            });

            return res.status(201).send({ success: true, msg: 'Resto has been reserved successfully', reservation: newReservation });
        } catch (error) {
            console.error('Error while reserving the resto:', error);
            res.status(500).json({ success: false, error: "Failed to make resto reservation" });
        }
    },

    skipReservation: async (req, res) => {
        
        const { userId, restoId } = req.body;
        console.log("Attempting to skip reservation resto:", { userId, restoId });
        
        try {

            // Skip a resto reservation entry from the database
            const reservationSkip = restoReservation.deleteMany({
                where: {
                    userId: parseInt(userId),
                    resto: { userId: parseInt(userId) }
                },
            })
    
            prisma
                .$transaction([reservationSkip])
                .then(() => {
                    res.status(200).send({
                        message: 'Resto Reservation has been deleted successfully',
                    })
                })
                .catch((error) => {
                    res.status(500).send({
                        message: error.message || `Some error occurred while deleting the resto reservation`,
                    })
                })

        } catch (error) {
            console.error('Error while removing a reservation to resto:', error);
            res.status(500).json({ success: false, error: "Failed to remove resto reservation" });
        }

    },
}