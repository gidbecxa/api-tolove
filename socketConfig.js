const { createServer } = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require("uuid");

const prisma = new PrismaClient();

const setupSocketIO = (server) => {
    /* Create a new HTTP server using the existing express server
        and Initialize socket.io */
    const httpServer = createServer(server);
    const io = new Server(httpServer);

    const userSockets = new Map();

    io.on('connection', async (socket) => {
        console.log('A user is connected. Socket id:', socket.id);

        socket.on('authenticate', async (userId) => {
            // Store user-to-socket mapping in memory
            userSockets.set(userId, socket.id);
            console.log(`User ${userId} authenticated`);

            // Update the user's online status to true in the database
            await prisma.user.update({
                where: { id: userId },
                data: { isOnline: true },
            });
        });

        socket.on('joinChatroom', async (chatroomId, userId) => {
            socket.join(chatroomId);
            console.log(`User ${userId} joined chatroom ${chatroomId}`);
        });

        socket.on('sendMatch', async (senderUserId, targetUserId, isConfirm, typeMatch) => {
            console.log(`Match from user ${senderUserId} to user ${targetUserId}`);

            // Save the match in the database...
            const sentMatch = await prisma.match.create({
                data: {
                    fromId: senderUserId,
                    toId: targetUserId,
                    isConfirm: isConfirm,
                    typeMatch: typeMatch
                },
            });
            console.log("Match sent:", sentMatch);
        });

        socket.on('confirmMatch', async (matchId, senderUserId) => {
            try {
                // Update the match in the database
                const updatedMatch = await prisma.match.update({
                    where: { id: matchId },
                    data: { isConfirm: true },
                });
                console.log(`Match ${matchId} confirmed by user ${senderUserId}`);

                // Emit a confirmation event to the sender's socket
                // const senderSocketId = await getSocketIdFromUserId(senderUserId);
                // if (senderSocketId) {
                //     socket.to(senderSocketId).emit('matchConfirmed', updatedMatch);
                //     console.log(`Confirmation emitted to user ${senderUserId}`);
                // }
            } catch (error) {
                console.error('Error confirming match:', error);
            }
        });

        socket.on('sendMessage', async (message, recipientUserId, senderUserId, chatroomId) => {
            //console.log(`{ message: ${message}, recepient: ${recipientUserId}, sender: ${senderUserId}, chatroom: ${chatroomId}}`);
            // console.log('Socket: message received', message.text);

            // Check chatroomId. If 0, create a new chatroomId
            if (chatroomId === 0) {
                // Check if a chatroom exists with the sender and recipient as participants
                const existingChatroom = await prisma.chatRoom.findFirst({
                    where: {
                        OR: [
                            { participant: { equals: [senderUserId, recipientUserId] } },
                            { participant: { equals: [recipientUserId, senderUserId] } }
                        ],
                    },
                });

                if (existingChatroom) {
                    // Chatroom already exists
                    chatroomId = existingChatroom.id;
                } else {
                    // Create a new chatroom
                    const participant = [senderUserId, recipientUserId];

                    // Create a new chatroom in the database
                    const createdChatroom = await prisma.chatRoom.create({
                        data: {
                            participant: participant,
                        },
                    });

                    console.log('New chatroom created:', createdChatroom);
                    chatroomId = createdChatroom.id;
                }
            }

            // Store the message in the database before emitting to the user

            let storedMessage;

            // Will check if the message object contains an image...
            if (message.image) {
                const presignedURL = message.image;
                const objectURL = getObjectURLFromPresignedURL(presignedURL);

                storedMessage = await prisma.message.create({
                    data: {
                        contenu: message.text || "",
                        typeMessage: 'image',
                        mediaUrl: objectURL,
                        sender: senderUserId,
                        dateMessage: message.createdAt,
                        status: 'send',
                        chatId: chatroomId,
                    },
                });
            } else {
                storedMessage = await prisma.message.create({
                    data: {
                        contenu: message.text || "",
                        typeMessage: 'text',
                        sender: senderUserId,
                        // dateMessage: message.createdAt,
                        dateMessage: new Date(),
                        status: 'send',
                        chatId: chatroomId,
                    },
                });
            }
            console.log("Stored message", storedMessage);

            // Update the ChatRoom table here

            // Emit the message to the recipient's socket
            const recipientSocketId = userSockets.get(recipientUserId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('receiveMessage', storedMessage);
                console.log("Message emitted to recipient");
            }

            // Emit the message to the sender's socket
            const senderSocketId = userSockets.get(senderUserId);
            console.log("sender socket ID", senderSocketId);
            if (senderSocketId) {
                io.to(senderSocketId).emit('receiveMessage', storedMessage);
                console.log("Message emitted to sender");
            }

            // Update the last message and status in the chatroom
            await prisma.chatRoom.update({
                where: { id: chatroomId },
                data: {
                    lastMessage: message.image ? 'Photo' : message.text,
                    lastMessageSender: senderUserId,
                    lastMessageStatus: 'send',
                },
            });

            // Send an event to update recent messages list
            io.emit('updateChatroom', chatroomId);
        });

        socket.on('sendLockRequest', async (message, recipientUserId, senderUserId, chatroomId) => {
            if (chatroomId === 0) {
                const participant = [senderUserId, recipientUserId];

                // Create a new chatroom in the database
                const createdChatroom = await prisma.chatRoom.create({
                    data: {
                        participant: participant,
                    },
                });

                chatroomId = createdChatroom.id;
            }

            // Store the request in the database. It will be temporary
            let requestMessage = await prisma.message.create({
                data: {
                    contenu: message.text,
                    title: message.title,
                    typeMessage: 'custom',
                    sender: senderUserId,
                    dateMessage: message.createdAt,
                    status: 'send',
                    chatId: chatroomId,
                },
            });
            console.log('message to emit', requestMessage);

            // Emit the request to the recipient's socket
            const recipientSocketId = userSockets.get(recipientUserId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('receiveLockRequest', requestMessage);
                console.log("Lock request emitted to recipient");
            }

            // Emit the request to the sender's socket
            const senderSocketId = userSockets.get(senderUserId);
            console.log("sender socket ID", senderSocketId);
            if (senderSocketId) {
                io.to(senderSocketId).emit('receiveLockRequest', requestMessage);
                console.log("Lock request emitted to sender");
            }

            // Update the last message and status in the chatroom
            await prisma.chatRoom.update({
                where: { id: chatroomId },
                data: {
                    lastMessage: message.image ? 'Photo' : message.text,
                    lastMessageSender: senderUserId,
                    lastMessageStatus: 'send',
                },
            });
        });

        socket.on('rejectLockRequest', async (requestMessage, chatroomId, recipientUserId, senderUserId) => {
            console.log(`rejectLockRequest event received in chatroom ${chatroomId} for message: ${requestMessage}`);
            // Extract the message id from the received requestMessage
            const messageId = requestMessage._id;

            // Check if the message exists before attempting to delete it
            const messageExists = await prisma.message.findFirst({
                where: {
                    id: messageId,
                },
            });

            if (!messageExists) {
                console.log(`Message with id ${messageId} does not exist. Skipping delete request...`);
                return;
            }

            // Delete request from database...
            try {

                await prisma.message.delete({
                    where: {
                        id: messageId,
                    },
                });

                console.log(`Message with id ${messageId} deleted successfully.`);
            } catch (error) {
                console.error('Error occurred while deleting the message:', error);
            }

            const requestResponseText = 'Votre proposition de cadenas a été reporté à plus tard. Vous aurez plus de chance la prochaine fois';
            const requestResponseTitle = 'CADENAS REPORTÉ';

            // Store the request in the database. It should be temporary...
            let requestResponse = await prisma.message.create({
                data: {
                    contenu: requestResponseText,
                    title: requestResponseTitle,
                    typeMessage: 'custom',
                    sender: senderUserId,
                    dateMessage: new Date(),
                    status: 'send',
                    chatId: chatroomId,
                },
            });
            console.log('message to emit', requestResponse);

            // Emit the request to the recipient's socket
            const recipientSocketId = userSockets.get(recipientUserId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('receiveLockResponse', requestResponse);
                console.log("Lock request response emitted to recipient");
            }
        });

        socket.on('acceptLockRequest', async (requestMessage, chatroomId, recipientUserId, senderUserId) => {
            console.log(`acceptLockRequest event received in chatroom ${chatroomId} for message: ${requestMessage}`);

            // Extract the message id from the received requestMessage
            const messageId = requestMessage._id;

            // Check if the message exists before attempting to delete it
            const messageExists = await prisma.message.findFirst({
                where: {
                    id: messageId,
                },
            });

            if (!messageExists) {
                console.log(`Message with id ${messageId} does not exist. Skipping delete request...`);
                return;
            }

            // Delete request from database...
            try {

                await prisma.message.delete({
                    where: {
                        id: messageId,
                    },
                });

                console.log(`Message with id ${messageId} deleted successfully.`);
            } catch (error) {
                console.error('Error occurred while deleting the message:', error);
            }

            const requestResponseText = 'Félicitations, votre proposition de vérouillage a été accepté. Désormais vous êtes le seul membre avec qui cette personne pourra discuter';
            const requestResponseTitle = 'CADENAS ACCEPTÉ';

            // Store the request in the database. It should be temporary...
            let requestResponse = await prisma.message.create({
                data: {
                    contenu: requestResponseText,
                    title: requestResponseTitle,
                    typeMessage: 'custom',
                    sender: senderUserId,
                    dateMessage: new Date(),
                    status: 'send',
                    chatId: chatroomId,
                },
            });

            console.log('message to emit', requestResponse);

            // Emit the response to the recipient's and sender's socket
            const recipientSocketId = userSockets.get(recipientUserId);
            if (recipientSocketId) {
                io.to(recipientSocketId).emit('receiveLockResponse', requestResponse);
                console.log("Lock request response emitted to recipient");
            }

            const senderSocketId = userSockets.get(senderUserId);
            console.log("sender socket ID", senderSocketId);
            if (senderSocketId) {
                io.to(senderSocketId).emit('receiveLockResponse', requestResponse);
                console.log("Lock request response emitted to sender");
            }

            // Store both users in the LockedConversations table
            try {
                const lockedConversation = await prisma.lockedConversation.create({
                    data: {
                        initiatorId: parseInt(senderUserId),
                        receiverId: parseInt(recipientUserId),
                    },
                });

                console.log("Users stored in the LockedConversation table:", lockedConversation);
            } catch (error) {
                console.error('Error occurred while storing users in LockedConversation:', error)
            }

        });

        socket.on('responseMessageRead', async (messageId) => {
            console.log('Event to delete response message', messageId);

            // Check if the message exists before attempting to delete it
            const messageExists = await prisma.message.findFirst({
                where: {
                    id: messageId,
                },
            });

            if (!messageExists) {
                console.log(`Message with id ${messageId} does not exist. Skipping delete.`);
                return;
            }

            // Delete response from database...
            try {

                await prisma.message.delete({
                    where: {
                        id: messageId,
                    },
                });

                console.log(`Message with id ${messageId} deleted successfully.`);
            } catch (error) {
                console.error('Error occurred while deleting the message:', error);
            }
        });

        // Event handler for disconnection
        socket.on('disconnect', async () => {

            // Find user associated with the disconnected socket
            let disconnectedUser = null;
            for (const [userId, socketId] of userSockets.entries()) {
                if (socketId === socket.id) {
                    disconnectedUser = userId;
                    userSockets.delete(userId);
                    console.log(`User ${userId} disconnected`);
                    break;
                }
            }

            if (disconnectedUser) {
                // Update the user's online status to false in the database
                await prisma.user.update({
                    where: { id: disconnectedUser },
                    data: { isOnline: false }
                });
            }
        });
    });

    return httpServer;
};

module.exports = setupSocketIO;

const getObjectURLFromPresignedURL = (presignedURL) => {
    const url = new URL(presignedURL);
    const objectURL = url.origin + url.pathname;
    return objectURL;
};