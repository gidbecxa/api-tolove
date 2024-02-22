const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { myS3Client } = require('../Utils/s3Client');
const fs = require('fs');

module.exports = {
    getAll: async (req, res) => {
        try {
            const hostels = await prisma.hostel.findMany({
                select: {
                    id: true,
                    name: true,
                    description: true,
                    location: true,
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

            res.status(200).send(hostels);
        } catch (error) {
            res.status(500).send({
                message: error.message || `An error occurred`,
            });
        }
    },

    getOne: async (req, res) => {
        try {
            const { id } = req.params;

            const hostel = await prisma.hostel.findUnique({
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

            const statusCode = hostel ? 200 : 404;
            const response = hostel || { message: `Cannot find hostel with id = ${id}` };
            res.status(statusCode).send(response);
        } catch (error) {
            res.status(500).send({
                message: error.message || `Some error occurred while retrieving the hostel with id=${id}`,
            });
        }
    },

    searchHostel: async function (req, res) {
        const { inputvalue } = req.body;

        try {
            const data = await prisma.hostel.findMany({
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
            console.error('Error occurred while querying hostels table:', error);
            res.status(500).json({ error: 'An error occurred' });
        }

    },

    addHostel: async function (req, res) {
        // console.log("Request body:", req.body);
        const { name, description, location, countryId, cityId, } = req.body;
        console.log("Attempting to add hostel:", { name, description, location, countryId, cityId });

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const { filename, path } = file;

        try {

            const uploadParams = {
                Bucket: 'hostel.toloveapp-storage',
                Key: `hostel${hostelId}/${filename}`,
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

            // Create a new hostel in the database
            const newHostel = await prisma.hostel.create({
                data: {
                    name: name,
                    description: description,
                    location: location,
                    countryId: countryId,
                    cityId: cityId,
                    image: imageUrl,
                },
            });

            return res.status(201).send({ success: true, msg: 'Hostel has been added successfully', hostel: newHostel });
        } catch (error) {
            console.error('Error while adding hostel:', error);
            res.status(500).json({ success: false, error: "Failed to add hostel" });
        }
    },

    updateHostel: async (req, res) => {

        const { id } = req.params;
        const { name, description, location, countryId, cityId, } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded', msg: 'No file uploaded'  });
        }

        const file = req.file;
        const { filename, path } = file;

        try {
            const uploadParams = {
                Bucket: 'hostel.toloveapp-storage',
                Key: `hostel${id}/${filename}`,
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

            const hostel = await prisma.hostel.update({
                where: { id: parseInt(id) },
                data: {
                    name: name,
                    description: description,
                    location: location,
                    countryId: countryId,
                    cityId: cityId,
                    image: imageUrl,
                },
            });

            res.status(200).json({ success: true, hostel })
        } catch (error) {
            console.error("Error updating hostel infos: ", error);
            res.status(500).json({ success: false, error: "Failed to update hostel infos" })
        }
    },

    deleteHostel: async (req, res) => {

        const { id } = req.params

        const deleteHostel = Hostel.delete({
            where: {
                id: parseInt(id),
            },
        })

        prisma
            .$transaction([deleteHostel])
            .then(() => {
                res.status(200).send({
                    message: 'Hostel has been deleted successfully',
                })
            })
            .catch((error) => {
                res.status(500).send({
                    message: error.message || `Some error occurred while deleting the hostel with id=${id}`,
                })
            })
    },
      
    likeHostel: async function (req, res) {
        const { userId, hostelId } = req.body;
        console.log("Attempting to like hostel:", { userId, hostelId });

        try {
            // Check if current user has already like this hostel
            const checkingLike = await prisma.likedHostel.findFirst({
                where: {
                    userId: userId,
                    hostelId: hostelId
                },
            });

            if (checkingLike) {
                return res.status(422).send({ success: false, msg: 'This hostel has already been liked by this user' });
            }

            // Create a new hostel like entry in the database
            const newLikedHostel = await prisma.likedHostel.create({
                data: {
                    userId: userId,
                    hostelId: hostelId,
                },
            });
    
            const updateHostelLikes = await prisma.hostel.update({
                where: {
                    id: hostelId
                },
                data: {
                    likes: {
                        create: {
                            userId: userId,
                            hostelId: hostelId,
                        }
                    }
                }
            });

            return res.status(201).send({ success: true, msg: 'Hostel has been liked successfully', like: newLikedHostel });
        } catch (error) {
            console.error('Error while adding a like to hostel:', error);
            res.status(500).json({ success: false, error: "Failed to add hostel like" });
        }
    },
      
    unLikeHostel: async function (req, res) {
        const { userId, hostelId } = req.body;
        console.log("Attempting to unlike hostel:", { userId, hostelId });

        try {
            // Check if current user has already like this hostel
            const checkingLike = await prisma.likedHostel.findFirst({
                where: {
                    userId: userId,
                    hostelId: hostelId
                },
            });

            if (!checkingLike) {
                return res.status(422).send({ success: false, msg: 'This user never like this hostel' });
            }

            // Remove a hostel like entry from the database
            const removeLike = LikedHostel.deleteMany({
                where: {
                    userId: parseInt(userId),
                    hostelId: parseInt(hostelId),
                },
            })
    
            prisma
                .$transaction([removeLike])
                .then(() => {
                    res.status(200).send({
                        message: 'Hostel Like has been deleted successfully',
                    })
                })
                .catch((error) => {
                    res.status(500).send({
                        message: error.message || `Some error occurred while deleting the hostel like`,
                    })
                })

        } catch (error) {
            console.error('Error while removing a like to hostel:', error);
            res.status(500).json({ success: false, error: "Failed to remove hostel like" });
        }
    },
    
    checkHostelLike: async (req, res) => {
        // CHECKING
        const { userId, hostelId } = req.params;

        try {
            const checking = await prisma.likedHostel.findFirst({
                where: {
                    userId: userId,
                    hostelId: hostelId,
                },
                select: {
                    id: true,
                    userId: true,
                    hostelId: true,
                }
            });

            let statusCode;
            let response;

            if(checking) {
                statusCode = 201;
                response = { success: true, msg: 'This hostel is been liked by this user', checking: true };
            } else {
                statusCode = 500;
                response = { message: `This user never like this hostel` };
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

        const { userId, hostelId, startDate, endDate } = req.body;
        console.log("Attempting to make reservation hostel:", { userId, hostelId, startDate, endDate });

        try {
            // Check if current user has already like this hostel
            const checkingReservation = await prisma.hostelReservation.findFirst({
                where: {
                    userId: userId,
                    hostelId: hostelId,
                    startDate: startDate,
                    endDate: endDate
                },
            });

            if (checkingReservation) {
                return res.status(422).send({ success: false, msg: 'This hostel has already been reserved by this user at this time' });
            }

            // Create a new hostel like entry in the database
            const newReservation = await prisma.hostelReservation.create({
                data: {
                    userId: userId,
                    hostelId: hostelId,
                    startDate: startDate,
                    endDate: endDate
                },
            });
        
            const updateHostelReservations = await prisma.hostel.update({
                where: {
                    id: hostelId
                },
                data: {
                    reservations: {
                        create: {
                            userId: userId,
                            hostelId: hostelId,
                            startDate: startDate,
                            endDate: endDate
                        }
                    }
                }
            });

            return res.status(201).send({ success: true, msg: 'Hostel has been reserved successfully', reservation: newReservation });
        } catch (error) {
            console.error('Error while reserving the hostel:', error);
            res.status(500).json({ success: false, error: "Failed to make hostel reservation" });
        }
    },

    skipReservation: async (req, res) => {
        
        const { userId, hostelId } = req.body;
        console.log("Attempting to skip reservation hostel:", { userId, hostelId });
        
        try {

            // Skip a hostel reservation entry from the database
            const reservationSkip = hostelReservation.deleteMany({
                where: {
                    userId: parseInt(userId),
                    hostel: { userId: parseInt(userId) }
                },
            })
    
            prisma
                .$transaction([reservationSkip])
                .then(() => {
                    res.status(200).send({
                        message: 'Hostel Reservation has been deleted successfully',
                    })
                })
                .catch((error) => {
                    res.status(500).send({
                        message: error.message || `Some error occurred while deleting the hostel reservation`,
                    })
                })

        } catch (error) {
            console.error('Error while removing a reservation to hostel:', error);
            res.status(500).json({ success: false, error: "Failed to remove hostel reservation" });
        }

    },
}