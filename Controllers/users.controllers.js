const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const { PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
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
                role: 'USER',
                genre: preference,
                isCertified: true,
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
                    villes: true
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

    getusersByAgesInterval: async (req, res) => {
        const { firstAge, secondAge } = req.body;
        console.log(`Query: limit: ${req.query.limit}, page: ${req.query.page}`);
        const limit = parseInt(req.query.limit) || 8;
        const page = parseInt(req.query.page) || 0;

        try {
            const totalRows = await prisma.user.count();

            const getUsersBetweenTwoAges = prisma.user.findMany({
                where: {
                    userAge: {
                        gte: parseInt(firstAge), // Start of age range
                        lte: parseInt(secondAge), // End of age range
                    },
                },
                orderBy: { createdAt: 'desc' }
            });

            const totalPage = Math.ceil(totalRows / limit);

            res.status(200).json({
                result: getUsersBetweenTwoAges,
                page: page,
                limit: limit,
                totalRows: totalRows,
                totalPage: totalPage
            });
        } catch (error) {
            res.status(500).send({
                message: error.message || 'Some error occurred while retrieving users by age interval',
            })
        }
    },

    getUsersInSameCountry: async (req, res) => {
        const { id } = req.params;

        try {
            const user = await prisma.user.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    coins: true,
                },
            });

            if (!user) {
                res.status(404).send({ message: `Cannot find user with id = ${id}` });
            }

            const users = await prisma.user.findMany({
                where: {
                    pays: user.pays,
                    isOnline: true
                },
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

            res.status(200).send(users);
        } catch (error) {
            res.status(500).send({
                message: error.message || `An error occurred`,
            });
        }
    },

    getUsersOfSameDisponibility: async (req, res) => {
        console.log(`Query: limit: ${req.query.limit}, page: ${req.query.page}`);
        const limit = parseInt(req.query.limit) || 8;
        const page = parseInt(req.query.page) || 0;

        try {
            const currentUser = await prisma.user.findUnique({
                where: {
                    id: req.user.id,
                },
                select: {
                    disponiblePour: true,
                },
            });

            const disponiblePour = currentUser.disponiblePour || null;

            const whereQueries = {
                NOT: {
                    id: {
                        equals: req.user.id,
                    }
                },
                role: 'USER',
                disponiblePour: disponiblePour,
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

            const totalRows = await prisma.user.count({
                where: whereQueries,
            });

            const users = await prisma.user.findMany({
                skip: limit * page,
                take: limit,
                where: whereQueries,
                select: {
                    id: true,
                    username: true,
                    birthday: true,
                    description: true,
                    disponiblePour: true,
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

    // Controller to update user's data from Complementpart1 screen
    updateProfilPartOne: async (req, res) => {
        const { id } = req.params;
        // console.log('id: ', id);
        const { username, genre, preference, preferencePays, birthday, ville } = req.body;
        console.log('Request body ', req.body);

        try {
            const user = await prisma.user.update({
                where: { id: parseInt(id) },
                data: {
                    username: username,
                    genre: genre,
                    preference: preference,
                    birthday: birthday,
                    villes: ville,
                    preferencePays: preferencePays,
                },
            });

            res.status(200).json({ success: true, user })
        } catch (error) {
            console.error("Error updating user: ", error);
            res.status(500).json({ success: false, error: "Failed to update user" })
        }
    },

    updateProfilPartTwo: async (req, res) => {
        const { id } = req.params;
        console.log('Update data step 2 for user ', id);
        console.log('Request body ', req.body);
        const { description } = req.body;

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded', msg: 'No file uploaded' });
        }

        const file = req.file;
        const { filename, path } = file;

        try {
            const uploadParams = {
                Bucket: 'user.dmvision-bucket',
                Key: `user${id}/${filename}`,
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
                return;
            }

            const imageUrl = `https://s3.eu-west-2.amazonaws.com/${uploadParams.Bucket}/${uploadParams.Key}`;

            const user = await prisma.user.update({
                where: { id: parseInt(id) },
                data: {
                    photoProfil: imageUrl,
                    description: description,
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
        console.log('Getting chatrooms for user', id);

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
                        // take: 1,
                    },
                },
            });

            const sortedChatrooms = chatrooms.map(chatroom => {
                const unreadMessagesCount = chatroom.messages.filter(message =>
                    message.status !== 'read' && message.sender !== parseInt(id)
                ).length;
                return {
                    ...chatroom,
                    unreadMessagesCount,
                };
            }).sort((a, b) => {
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

    updateMessagesStatusToRead: async (req, res) => {
        const { id } = req.params;

        try {
            await prisma.message.updateMany({
                where: {
                    chatId: parseInt(id),
                },
                data: {
                    status: 'read',
                }
            });

            res.status(200).json({ success: true, message: 'Messages status updated to read' });
        } catch (error) {
            console.error("Error updating messages status to read: ", error);
            res.status(500).json({ success: false, error: "Failed to update messages status to read" });
        }
    },

    getChatRoomIdForUsers: async (req, res) => {
        const { user1, user2 } = req.body;

        try {
            const chatroom = await prisma.chatRoom.findFirst({
                where: {
                    participant: {
                        array_contains: [parseInt(user1), parseInt(user2)],
                    },
                },
            });

            if (chatroom) {
                res.json({ chatroomId: chatroom.id });
            } else {
                res.json({ chatroomId: null });
            }
        } catch (error) {
            console.error('Error occurred while querying ChatRoom:', error);
            res.status(500).json({ error: 'An error occurred while fetching the chatroom ID.' });
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
            Bucket: 'user.dmvision-bucket',
            Key: photoProfilUrl.replace(`https://s3.eu-west-2.amazonaws.com/user.dmvision-bucket/`, ''),
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

    getPhotoWithUrl: async (req, res) => {
        const { photoURL } = req.body;
        console.log('URL for presignedURL: ', photoURL);

        // Determine the bucket dynamically
        const bucketPrefix = photoURL.includes('cadeau.dmvision-bucket') ? 'cadeau.dmvision-bucket' : 'user.dmvision-bucket';

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

    getAllChatroomMessagesNotReadCount: async (req, res) => {
        try {
            const { chatroomId } = req.params;
            console.log("Chatroom", chatroomId);
            // Update the status of this chatRoom messages
            const chatRoomMessagesCount = await prisma.chatRoom.count({
                where: {
                    chatRoom: {
                        id: parseInt(chatroomId),
                        messages: { isRead: false },
                    }
                },
            });

            // Return all messages
            return res.json({ messagesCount: chatRoomMessagesCount })
        } catch (error) {
            console.error('Error retrieving messages count:', error);
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

            const userMatches = await prisma.match.findMany({
                where: {
                    toId: parseInt(id),
                    typeMatch: 'normal',
                    isConfirm: false,
                },
            });

            const filteredMatches = await Promise.all(
                userMatches.map(async (match) => {
                    const chatroom = await prisma.chatRoom.findFirst({
                        where: {
                            participant: { array_contains: [parseInt(id), parseInt(match.fromId)] },
                        },
                    });

                    if (!chatroom) {
                        return match;
                    }
                    return null;
                })
            );

            const matches = filteredMatches.filter((match) => match !== null);

            res.status(200).json({ success: true, matches });
        } catch (error) {
            console.error('Error retrieving matches:', error);
            res.status(500).json({ success: false, error: 'Failed to retrieve matches' });
        }
    },

    getLockedUsers: async (req, res) => {
        const { id } = req.params;
        console.log('getLockedUsers: id of the current user:', id);

        try {
            const lockedConversation = await prisma.lockedConversation.findFirst({
                where: {
                    OR: [
                        { initiatorId: parseInt(id) },
                        { receiverId: parseInt(id) },
                    ],
                },
            });

            if (!lockedConversation) {
                res.json({ userLockedWith: null });
                return;
            }

            let userLockedWith;

            // If the current user is the initiator, return the receiverId
            if (lockedConversation.initiatorId === parseInt(id)) {
                userLockedWith = lockedConversation.receiverId;
            }
            // If the current user is the receiver, return the initiatorId
            else {
                userLockedWith = lockedConversation.initiatorId;
            }

            res.json({ userLockedWith });
        } catch (error) {
            console.error('Error occurred while querying LockedConversation table:', error);
            res.status(500).json({ error: 'An error occurred' });
        }
    },

    checkLockedUsers: async (req, res) => {
        console.log('checking locked status...')
        const { user1, user2 } = req.body;

        try {
            const lockedConversation = await prisma.lockedConversation.findFirst({
                where: {
                    OR: [
                        { initiatorId: parseInt(user1), receiverId: parseInt(user2) },
                        { initiatorId: parseInt(user2), receiverId: parseInt(user1) },
                    ],
                },
            });

            const areUsersLocked = !!lockedConversation;
            res.json({ areUsersLocked });
        } catch (error) {
            console.error('Error occurred while querying LockedConversation table:', error);
            res.status(500).json({ error: 'An error occurred' });
        }
    },

    //----------------------- udpate indivudual -------------------------------

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
            Bucket: 'user.dmvision-bucket',
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
            Bucket: 'user.dmvision-bucket',
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


    updateCoins: async function (req, res) {

        const { id } = req.params;
        const { coins } = req.body;
        console.log('Body:', req.body);

        prisma.user.update({
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
    },

    createGift: async (req, res) => {
        console.log("Creating new gift...");
        console.log("New gift details:", req.body);

        const { nom, prix, category, isAvailable } = req.body;

        // Handle image upload to S3
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded' });
        }

        const file = req.file;
        const { filename, path } = file;

        try {
            // const randomString = Math.random().toString(36).substring(2, 15) /** + Math.random().toString(36).substring(2, 15)*/;
            const uploadParams = {
                Bucket: 'cadeau.dmvision-bucket',
                Key: `gifts/${filename}`,
                Body: fs.createReadStream(path),
                ContentType: file.mimetype,
            };

            try {
                const uploadResponse = await myS3Client.send(new PutObjectCommand(uploadParams));
                console.log(`Successfully uploaded Gift image to S3: ${uploadParams.Key}`);
            } catch (err) {
                console.error('Error uploading Gift image to S3:', err);
                res.status(500).json({ error: 'Error uploading Gift image to S3' });
            }

            const imageUrl = `https://s3.eu-west-2.amazonaws.com/${uploadParams.Bucket}/${uploadParams.Key}`;

            // Creating the gift in the DB
            const newGift = await prisma.gift.create({
                data: {
                    nom: nom,
                    prix: parseInt(prix),
                    image: imageUrl,
                    giftCategory: category,
                    isAvailable: isAvailable === 'true' ? true : false,
                },
            });

            console.log("Gift successfully created", newGift);
            res.status(200).json({ success: true, newGift });
        } catch (error) {
            console.error('Error creating gift:', error);
            res.status(500).json({ error: 'Failed to create gift' }); // Internal server error
        }
    },

    getGifts: async (req, res) => {
        console.log("Attempting to fetch gifts...");

        try {
            const gifts = await prisma.gift.findMany();

            res.status(200).json(gifts);
        } catch (error) {
            console.error('Error getting gifts:', error);
            res.status(500).json({ error: 'Failed to get gifts' });
        }
    },

    getGiftsByCategory: async (req, res) => {
        const { category } = req.params;
        console.log("Attempting to fetch gifts by category...", category);
        const page = parseInt(req.query.page) || 1;
        console.log("Page:", page);
        const limit = 12;

        try {
            const gifts = await prisma.gift.findMany({
                where: {
                    giftCategory: category,
                },
                skip: (page - 1) * limit,
                take: limit,
            });

            res.status(200).json(gifts);
        } catch (error) {
            console.error('Error fetching gifts by category and page:', error);
            res.status(500).json({ error: 'Internal server error' });
        }
    },

    makePurchase: async (req, res) => {
        try {
            console.log("Creating new purchase...");
            console.log("New purchase details:", req.body);

            const { giftId, quantity, senderId, receiverId } = req.body;

            const newPurchase = await prisma.purchase.create({
                data: {
                    gift: { connect: { id: parseInt(giftId) } },
                    qtyPurchased: parseInt(quantity),
                    datePurchased: new Date(),
                    sender: { connect: { id: parseInt(senderId) } },
                    receiver: { connect: { id: parseInt(receiverId) } },
                },
            });

            console.log("Purchase successfully created", newPurchase);
            res.status(200).json({ success: true, newPurchase });
        } catch (error) {
            console.error('Error creating purchase:', error);
            res.status(500).json({ error: 'Failed to create purchase' });
        }
    },

    getPurchasesByUsers: async (req, res) => {
        const { senderId, receiverId } = req.params;

        try {
            const purchases = await prisma.purchase.findMany({
                where: {
                    senderId: parseInt(senderId),
                    receiverId: parseInt(receiverId),
                    status: 'pending'
                },
                include: {
                    gift: {
                        select: {
                            nom: true,
                            image: true,
                            giftCategory: true,
                        },
                    },
                },
            });

            // if (purchases.length === 0) {
            //     console.log(`No purchases found for sender ID ${senderId} and receiver ID ${receiverId}`);
            //     return null;
            // }

            console.log(`Found ${purchases.length} purchases for sender ID ${senderId} and receiver ID ${receiverId}`);
            res.status(200).json(purchases);
        } catch (error) {
            console.error('Error fetching purchases:', error);
            res.status(500).json({ error: 'Failed to fetch purchases' });
        }
    },

    getPurchasesForUser: async (req, res) => {
        const { receiverId } = req.params;

        try {
            const purchases = await prisma.purchase.findMany({
                where: {
                    receiverId: parseInt(receiverId),
                },
                include: {
                    gift: {
                        select: {
                            nom: true,
                            image: true,
                            giftCategory: true,
                        },
                    },
                },
            });

            console.log(`Found ${purchases.length} purchases for receiver ID ${receiverId}`);
            res.status(200).json(purchases);
        } catch (error) {
            console.error('Error fetching purchases:', error);
            res.status(500).json({ error: 'Failed to fetch purchases' });
        }
    },

    updatePurchaseDeliveryInfo: async (req, res) => {
        const { purchaseId, fullName, deliveryAddress } = req.body;

        try {
            const purchase = await prisma.purchase.update({
                where: { id: parseInt(purchaseId) },
                data: {
                    recipientFullName: fullName,
                    deliveryAddress: deliveryAddress,
                    status: 'processing'
                }
            });

            res.status(200).json({ success: true, purchase });
        } catch (error) {
            console.error('Error updating purchase:', error);
            res.status(500).json({ error: 'Failed to update purchase' });
        }
    },

    requestAccountDelete: async (req, res) => {
        try {
            const { userId, description } = req.body;

            const newDeleteRequest = await prisma.accountDelete.create({
                data: {
                    userId: parseInt(userId),
                    description: description,
                    // status: 'pending',
                },
            });

            return res.status(200).json({ success: true, newDeleteRequest });
        } catch (error) {
            console.error('Error registering account deletion request:', error);
            res.status(500).json({ success: false, message: 'Failed to register account deletion request.' });
        }
    }

}
