const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const { PutObjectCommand, GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { myS3Client } = require('../Utils/s3Client');
const fs = require('fs');

module.exports = {
    // Fetch users' profile...
    getMany: async (req, res) => {
        console.log(`Query: limit: ${req.query.limit}, page: ${req.query.page}`);
        const limit = parseInt(req.query.limit) || 8;
        const page = parseInt(req.query.page) || 0;

        try {
            const currentUser = await prisma.user.findUnique({
                where: {
                    id: req.user.id,
                },
                select: {
                    preference: true,
                },
            });

            const preference = currentUser.preference || null;
            const pays = req.query.pays;
            const isOnline = req.query.isOnline === 'true';

            const whereQueries = {
                NOT: {
                    id: {
                        equals: req.user.id,
                    }
                },
                genre: preference,
                to: {
                    // to get profiles that the user hasn't matched with
                    none: {
                        from: {
                            id: req.user.id,
                        },
                        isConfirm: true,
                    },
                },
            };

            // Add 'pays' condition to the 'where' clause if provided
            if (pays) {
                whereQueries.pays = pays;
            }

            // Add 'isOnline' condition to the 'where' clause if provided
            if (isOnline) {
                whereQueries.isOnline = true;
            }

            const totalRows = await prisma.user.count({
                where: whereQueries,
            });

            const users = await prisma.user.findMany({
                skip: limit * page,
                // skip: totalRows - (limit * (page + 1)),  // Start fetching the users from the last row and move backward in the result set
                take: limit,
                where: whereQueries,
                select: {
                    id: true,
                    username: true,
                    birthday: true,
                    // langage: true,
                    description: true,
                    genre: true,
                    photoProfil: true,
                    pays: true,
                },
                orderBy: {
                    id: 'desc', // Order by the ID in descending order (most recent first)
                },
            });

            const totalPage = Math.ceil(totalRows / limit);

            res.status(200).json({
                result: users,
                page: page,
                limit: limit,
                totalRows: totalRows,
                totalPage: totalPage
            });
        } catch (error) {
            res.status(500).send({
                message: error.message || 'Some error occurred while retrieving users',
            })
        }
    },

    getMe: async (req, res) => {

        let { isFake, isOnline, ...mics } = req.user;

        res.status(200).send({
            success: true,
            data: mics
        })
    },

    getUser: async (req, res) => {
        try {
            const { id } = req.params;

            const user = await prisma.user.findUnique({
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

            const statusCode = user ? 200 : 404;
            const response = user || { message: `Cannot find user with id = ${id}` };
            res.status(statusCode).send(response);
        } catch (error) {
            res.status(500).send({
                message: error.message || `Some error occurred while retrieving the user with id=${id}`,
            });
        }
    },

    // Controller to update user data from Complementpart1 screen
    updateProfilPartOne: async (req, res) => {
        const { id } = req.params;
        // console.log('id: ', id);
        const { username, genre, preference, birthday, ville } = req.body;
        // console.log('Request body ', req.body);

        try {
            const user = await prisma.user.update({
                where: { id: parseInt(id) },
                data: {
                    username: username,
                    genre: genre,
                    preference: preference,
                    birthday: birthday,
                    villes: ville
                },
            });

            res.status(200).json({ success: true, user })
        } catch (error) {
            console.error("Error updating user: ", error);
            res.status(500).json({ success: false, error: "Failed to update user" })
        }
    },

    updateUser: async (req, res) => {

        const { id } = req.params
        const { email, password } = req.body

        if (id == req.user.id) {

            prisma.user.findUnique({
                where: {
                    id: parseInt(id)
                },
                select: {
                    password: true
                }
            })
                .then((userFound) => {
                    bcrypt.compare(password, userFound.password, (errBycrypt, resBycrypt) => {
                        if (resBycrypt) {
                            prisma.user.update({
                                where: {
                                    id: parseInt(id),
                                },
                                data: {
                                    email: email,
                                },
                            })
                                .then(() => {
                                    res.status(200).send({
                                        message: 'User was updated successfully',
                                    })
                                })
                                .catch((error) => {
                                    res.status(500).send({
                                        message: error.message || `Some error occurred while updating the user with id=${id}`,
                                    })
                                })
                        }
                        else {
                            //message d'erreur mdp ou mail...
                            res.status(403).json({ 'error': 'username, email ou password invalide' });
                        }

                    });
                })
                .catch((err) => {
                    res.status(404).json({ 'error': err.message });
                })

        }
        else {
            res.status(403).json({ 'error': 'Some error occurred while updating the user with id=${id}' })
        }

    },

    deleteUser: async (req, res) => {

        const { id } = req.params

        const deleteUser = User.delete({
            where: {
                id: parseInt(id),
            },
        })

        prisma
            .$transaction([deleteUser])
            .then(() => {
                res.status(200).send({
                    message: 'User was deleted successfully',
                })
            })
            .catch((error) => {
                res.status(500).send({
                    message: error.message || `Some error occurred while deleting the user with id=${id}`,
                })
            })
    },

    //----------------------- get in-app data -------------------------------
    getChatroomsByParticipant: async (req, res) => {
        const { id } = req.params;

        try {
            console.log("User", id)
            const chatrooms = await prisma.chatRoom.findMany({
                where: {
                    participant: {
                        array_contains: parseInt(id),
                    },
                },
                include: {
                    messages: {
                        select: {
                            id: true,
                            contenu: true,
                            sender: true,
                            dateMessage: true,
                            status: true,
                        },
                        orderBy: {
                            dateMessage: 'desc',
                        },
                        take: 1,
                    },
                },
            });

            const sortedChatrooms = chatrooms.sort((a, b) => {
                const aLatestMessage = a.messages[0];
                const bLatestMessage = b.messages[0];

                if (aLatestMessage && bLatestMessage) {
                    return new Date(bLatestMessage.dateMessage) - new Date(aLatestMessage.dateMessage);
                } else if (aLatestMessage) {
                    return -1;
                } else if (bLatestMessage) {
                    return 1;
                } else {
                    return 0;
                }
            });
            // console.log(chatrooms);
            res.status(200).json({ success: true, sortedChatrooms });
        } catch (error) {
            console.error("Error retrieving chatrooms: ", error);
            res
                .status(500)
                .json({ success: false, error: "Failed to retrieve chatrooms" });
        }
    },

    /* getProfilePhoto: async (req, res) => {
        const { id } = req.params;

        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: { photoProfil: true },
        });

        if (!user || !user.photoProfil) {
            return res.status(404).json({ error: 'Profile photo not found' });
        }

        const photoProfilUrl = user.photoProfil;
        const params = {
            Bucket: 'user.toloveapp-storage',
            Key: photoProfilUrl.replace(`https://s3.eu-west-2.amazonaws.com/user.toloveapp-storage/`, ''),
        };

        try {
                // const response = await myS3Client.send(command);

                // Read the fetched image data as a Buffer
                // const imageBuffer = await new Promise((resolve, reject) => {
                //     const chunks = [];
                //     response.Body.on('data', (chunk) => chunks.push(chunk));
                //     response.Body.on('error', (err) => reject(err));
                //     response.Body.on('end', () => resolve(Buffer.concat(chunks)));
                // });
                // console.log(imageBuffer);

                // Determine the file extension of the S3 object
                // const fileExtension = extname(objectParams.Key).toLowerCase();
                // const contentTypeMap = {
                //     '.jpg': 'image/jpeg',
                //     '.jpeg': 'image/jpeg',
                //     '.png': 'image/png',
                // }
                // const contentType = contentTypeMap[fileExtension] || 'application/octet-stream';

                // res.setHeader('Content-Type', contentType);
                // res.setHeader('Content-Type', 'image/jpeg');
                // res.setHeader('Content-Length', imageBuffer.length);
                // res.status(200).end(imageBuffer);

                // Trying another approach different from the Buffer approach above
                const data = await myS3Client.send(command);
                const photoStream = data.Body;
                // console.log(photoStream);

                res.setHeader('Content-Type', 'image/jpeg');
                photoStream.pipe(res);
            } catch (error) {
                console.error(error);
            }
        } catch (error) {
            console.error("Error fetching profile photo: ", error);
            res.status(500).json({ success: false, error: "Failed to fetch profile photo" });
        }
    }, */

    getProfilePhoto: async (req, res) => {
        const { id } = req.params;

        try {
            const user = await prisma.user.findUnique({
                where: {
                    id: parseInt(id),
                },
                select: {
                    photoProfil: true,
                },
            });

            if (!user || !user.photoProfil) {
                return res.status(404).json({ success: false, error: "User or profile photo not found" });
            }

            const photoProfilUrl = user.photoProfil;

            const objectParams = {
                Bucket: 'user.toloveapp-storage',
                Key: photoProfilUrl.replace(`https://s3.eu-west-2.amazonaws.com/user.toloveapp-storage/`, ''),
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

    getPhotoWithUrl: async (req, res) => {
        const { photoURL } = req.body;
        console.log('URL for presignedURL: ', photoURL);

        const objectParams = {
            Bucket: 'user.toloveapp-storage',
            Key: photoURL.replace(`https://s3.eu-west-2.amazonaws.com/user.toloveapp-storage/`, ''),
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

    getAllChatroomMessages: async (req, res) => {
        try {
            const { chatroomId } = req.params;
            console.log("Chatroom", chatroomId);

            const chatRoom = await prisma.chatRoom.findUnique({
                where: { id: parseInt(chatroomId) },
                include: {
                    messages: {
                        orderBy: {
                            dateMessage: 'desc'
                        }
                    }
                },
            });

            if (!chatRoom) {
                return res.status(404).json({ error: 'Chatroom not found' });
            }

            // Return all messages
            return res.json({ messages: chatRoom.messages })
        } catch (error) {
            console.error('Error retrieving messages:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getLastMessage: async (req, res) => {
        try {
            const { chatroomId } = req.params;

            // Find the chatroom and include the messages ordered by dateMessage in descending order
            const chatRoom = await prisma.chatRoom.findUnique({
                where: { id: parseInt(chatroomId) },
                include: {
                    messages: {
                        orderBy: {
                            dateMessage: 'desc'
                        },
                        take: 1, // Only take the latest message
                    }
                },
            });

            if (!chatRoom) {
                return res.status(404).json({ error: 'Chatroom not found' });
            }

            const latestMessage = chatRoom.messages.length > 0 ? chatRoom.messages[0] : null;

            // Return the latest message
            return res.json({ latestMessage });
        } catch (error) {
            console.error('Error retrieving latest message:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    getUserMatches: async (req, res) => {
        try {
            const { id } = req.params;

            const matches = await prisma.match.findMany({
                where: {
                    toId: parseInt(id),
                    typeMatch: 'normal',
                    isConfirm: false,
                },
                /* include: {
                    from: true,
                    to: true,
                }, */
            });

            res.status(200).json({ success: true, matches });
        } catch (error) {
            console.error('Error retrieving matches:', error);
            res.status(500).json({ success: false, error: 'Failed to retrieve matches' });
        }
    },

    //----------------------- udpate indivuduel -------------------------------

    updateHobbies: async function (req, res) {

        const { id } = req.params
        const { hobbies } = req.body

        if (id == req.user.id) {

            prisma.user.update({
                where: {
                    id: parseInt(id),
                },
                data: {
                    hobbies: hobbies,
                },
            })
                .then(() => {
                    res.status(200).send({
                        message: 'User hobbies were updated successfully',
                    })
                })
                .catch((error) => {
                    res.status(500).send({
                        message: error.message || `Some error occurred while updating the user's hobbies`,
                    })
                })

        }
        else {
            res.status(403).json({ 'error': `Some error occurred while updating the hobbie, with id=${id}` });
        }

    },

    updateDescription: async function (req, res) {

        const { id } = req.params
        const { description } = req.body

        if (id == req.user.id) {

            prisma.user.update({
                where: {
                    id: parseInt(id),
                },
                data: {
                    description: description,
                },
            })
                .then(() => {
                    res.status(200).send({
                        message: 'Description was updated successfully',
                    })
                })
                .catch((error) => {
                    res.status(500).send({
                        message: error.message || `Some error occurred while updating the description with id=${id}`,
                    })
                })

        }
        else {
            res.status(403).json({ 'error': `Some error occurred while updating the description, with id=${id}` })
        }

    },

    uploadPhoto: async function (req, res) {
        const { id } = req.params

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const { filename, path } = file;

        const uploadParams = {
            Bucket: 'user.toloveapp-storage',
            Key: `user${id}/${filename}`,
            // Key: `users0723/${filename}`,
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

        res.status(200).send({
            message: 'Photo URL was updated successfully',
            imageUrl: imageUrl,
        })
    },

    updatePicture: async function (req, res) {
        const { id } = req.params
        console.log("uploading photo...");
        // const formData = req.body

        // Check if a file was uploaded
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const { filename, path } = file;

        const uploadParams = {
            Bucket: 'user.toloveapp-storage',
            Key: `user${id}/${filename}`,
            // Key: `users0723/${filename}`,
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

        if (id == req.user.id) {
            prisma.user.update({
                where: {
                    id: parseInt(id),
                },
                data: {
                    photoProfil: imageUrl,
                },
            })
                .then(() => {
                    res.status(200).send({
                        message: 'Photo URL was updated successfully',
                        imageUrl: imageUrl,
                    })
                })
                .catch((error) => {
                    console.error('Error updating photo URL:', error);
                    res.status(500).send({
                        message: error.message || `Failed to update photo URL for user ${id}`,
                    })
                })
        }
        else {
            res.status(403).json({ 'error': `Some error occurred with the id ${id}` });
        }
    },


    // å mettre probablement deans utils
    updateCoins: async function (req, res) {

        const { id } = req.params
        const { coins } = req.body

        User.update({
            where: {
                id: parseInt(id),
            },
            data: {
                coins: coins,
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


    updateCertified: async function (req, res) {

        const { id } = req.params
        const { isCertified } = req.body

        prisma.user.update({
            where: {
                id: parseInt(id),
            },
            data: {
                isCertified: isCertified,
            },
        })
            .then(() => {
                res.status(200).send({
                    message: 'IsCertified was updated successfully',
                })
            })
            .catch((error) => {
                res.status(500).send({
                    message: error.message || `Some error occurred while updating the isCertified with id=${id}`,
                })
            })
    },

    updateCompleted: async function (req, res) {

        const { id } = req.params
        const { isCompleted } = req.body

        prisma.user.update({
            where: {
                id: parseInt(id),
            },
            data: {
                isCompleted: isCompleted,
            },
        })
            .then(() => {
                res.status(200).send({
                    message: 'isCompleted was updated successfully',
                })
            })
            .catch((error) => {
                res.status(500).send({
                    message: error.message || `Some error occurred while updating the isCompleted field with id=${id}`,
                })
            })
    },


    /*  updateLongLat: async function (req, res){
         const { id } = req.params
         const { longitude, latitude } = req.body
 
         User.update({
             where: {
                 id: parseInt(id),
             },
             data: {
                 longitude: longitude,
                 latitude: latitude
             },
         })
         .then(() => {
             res.status(200).send({
                 message: 'Long and lat were updated successfully',
             })
         })
         .catch((error) => {
             res.status(500).send({
                 message: error.message || `Some error occurred while updating the Long and lat with id=${id}`,
             })
         })
     }, */

    /* updatePaysVille: async function (req, res){

        const { id } = req.params
        const { pays, villes } = req.body

        User.update({
            where: {
                id: parseInt(id),
            },
            data: {
                pays: pays,
                villes: villes
            },
        })
        .then(() => {
            res.status(200).send({
                message: 'Pays and ville were updated successfully',
            })
        })
        .catch((error) => {
            res.status(500).send({
                message: error.message || `Some error occurred while updating the pays and ville with id=${id}`,
            })
        })
    }, */

    updateOnline: async function (req, res) {

        const { id } = req.params
        const { isOnline } = req.body

        User.update({
            where: {
                id: parseInt(id),
            },
            data: {
                isOnline: isOnline,
            },
        })
            .then(() => {
                res.status(200).send({
                    message: 'isOnline was updated successfully',
                })
            })
            .catch((error) => {
                res.status(500).send({
                    message: error.message || `Some error occurred while updating the isOnline with id=${id}`,
                })
            })
    },

    updateRole: async function (req, res) {

        const { id } = req.params
        const { role } = req.body

        User.update({
            where: {
                id: parseInt(id),
            },
            data: {
                role: role,
            },
        })
            .then(() => {
                res.status(200).send({
                    message: 'Role was updated successfully',
                })
            })
            .catch((error) => {
                res.status(500).send({
                    message: error.message || `Some error occurred while updating the role with id=${id}`,
                })
            })
    },

    updateDeviceToken: async function (req, res) {

        const { id } = req.params
        const { deviceToken } = req.body

        User.update({
            where: {
                id: parseInt(id),
            },
            data: {
                deviceToken: deviceToken,
            },
        })
            .then(() => {
                res.status(200).send({
                    message: 'DeviceToken was updated successfully',
                })
            })
            .catch((error) => {
                res.status(500).send({
                    message: error.message || `Some error occurred while updating the deviceToken with id=${id}`,
                })
            })
    }

}