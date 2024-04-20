const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();
const bcrypt = require("bcrypt");
const { PutObjectCommand, GetObjectCommand, S3Client } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require("@aws-sdk/s3-request-presigner");
const { myS3Client } = require('../Utils/s3Client');
const fs = require('fs');

module.exports = {
    // Fetch users' profile...

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

    getNonCertifiedUsers: async (req, res) => {
        const limit = parseInt(req.query.limit) || 11;
        const page = parseInt(req.query.page) || 0;

        try {
            const totalRows = await prisma.user.count({
                where: {
                    isCertified: false,
                    NOT: [
                        { photoProfil: null },
                        { description: null }
                    ]
                },
            });

            const users = await prisma.user.findMany({
                skip: limit * page,
                take: limit,
                where: {
                    isCertified: false,
                    NOT: [
                        { photoProfil: null },
                        { description: null }
                    ]
                },
                select: {
                    id: true,
                    username: true,
                    description: true,
                    genre: true,
                    photoProfil: true,
                    pays: true,
                    villes: true,
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
                message: error.message || 'Some error occurred while retrieving non-certified users',
            });
        }
    },

    //----------------------- get in-app data -------------------------------
    getChatroomsByParticipant: async (req, res) => {
        const { id } = req.params;
        console.log('Getting chatrooms for agent', id);

        try {
            console.log("Agent", id)
            const chatrooms = await prisma.chatRoom.findMany({
                where: {
                    isSentByAgent: true,
                    agentId: parseInt(id),
                },
                include: {
                    messages: {
                        select: {
                            id: true,
                            contenu: true,
                            sender: true,
                            dateMessage: true,
                            status: true,
                            isSentByAgent: true,
                        },
                        orderBy: {
                            dateMessage: 'desc',
                        },
                        take: 1,
                    },
                },
            });

            const filteredChatroms = chatrooms.filter((chatroom) => {
                if (chatroom.messages.length > 0) {
                    const latestMessage = chatroom.messages[0];
                    return !latestMessage.isSentByAgent
                }
                return true;
            })

            const sortedChatrooms = filteredChatroms.sort((a, b) => {
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

    countAgentMessages: async (req, res) => {
        try {
            const { agentId } = req.params;
            console.log("Agent ID:", agentId);

            // Find all chatrooms where agentId matches
            const chatRooms = await prisma.chatRoom.findMany({
                where: { agentId: parseInt(agentId) },
                include: {
                    messages: {
                        where: { isSentByAgent: false }, // Filter messages by isSentByAgent
                    },
                },
            });

            let totalMessages = 0;

            if (!chatRooms || chatRooms.length === 0) {
                return res.status(404).json({ totalMessages });
            }

            // Calculate the total number of messages sent by the agent
            //   let totalMessages = 0;
            chatRooms.forEach((chatRoom) => {
                totalMessages += chatRoom.messages.length;
            });

            return res.json({ totalMessages });
        } catch (error) {
            console.error('Error counting agent messages:', error);
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

    getAgentMatches: async (req, res) => {
        try {
            const { id } = req.params;

            const agentUserIds = await prisma.user.findMany({
                where: {
                    assignedAgent: parseInt(id),
                },
                select: {
                    id: true,
                },
            });

            const agentMatches = await prisma.match.findMany({
                where: {
                    toId: {
                        in: agentUserIds.map((agentUserId) => agentUserId.id),
                    },
                    typeMatch: 'normal',
                    isConfirm: false,
                },
            });

            const filteredMatches = await Promise.all(
                agentMatches.map(async (match) => {
                    const chatroom = await prisma.chatRoom.findFirst({
                        where: {
                            participant: { array_contains: [parseInt(match.toId), parseInt(match.fromId)] },
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

}