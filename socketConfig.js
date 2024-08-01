const { createServer } = require('http');
const { Server } = require('socket.io');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const setupSocketIO = (server) => {
    /* Create a new HTTP server using the existing express server
    and Initialize socket.io */
    const httpServer = createServer(server);
    const io = new Server(httpServer);

    io.on('connection', (socket) => {
        console.log('A user is connected. Socket id:', socket.id);

        socket.on('joinChatroom', async (chatroomId, userId) => {
            socket.join(chatroomId);
            console.log(`User ${userId} joined chatroom ${chatroomId}`);

            // Update the user's online status to true in the database
            await prisma.user.update({
                where: { id: userId },
                data: { isOnline: true },
            });

            // Create or update the socket mapping in the database
            await prisma.socketMapping.upsert({
                where: { userId },
                create: { socketId: socket.id, userId },
                update: { socketId: socket.id }
            });
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

        socket.on('sendMessage', async (message, receipientUserId, senderUserId, chatroomId) => {
            console.log(`{ message: ${message}, recepient: ${receipientUserId}, sender: ${senderUserId}, chatroom: ${chatroomId}}`);

            // Store the message in the database before it is emitted to the user
            const storedMessage = await prisma.message.create({
                data: {
                    contenu: message,
                    typeMessage: 'text',
                    sender: senderUserId,
                    dateMessage: new Date(),
                    status: 'send',
                    chatId: chatroomId,
                },
            });
            // console.log("Stored message", storedMessage);

            // Emit the message to the recipient's socket
            const recipientSocketId = await getSocketIdFromUserId(receipientUserId);
            if (recipientSocketId) {
                socket.to(recipientSocketId).emit('receiveMessage', storedMessage);
                console.log("Message emitted to recipient");
            }

            // Emit the message to the sender's socket
            const senderSocketId = await getSocketIdFromUserId(senderUserId);
            console.log("sender socket ID", senderSocketId);
            if (senderSocketId) {
                io.to(senderSocketId).emit('receiveMessage', storedMessage);
                console.log("Message emitted to sender");
            }

            // Update the last message and status in the chatroom
            await prisma.chatRoom.update({
                where: { id: chatroomId },
                data: {
                    lastMessage: message,
                    lastMessageSender: senderUserId,
                    lastMessageStatus: 'send',
                },
            });

            // Send an emit to update chat

            // Send an emit to update recent messages
            io.emit('updateChatroom', chatroomId);
        });

        // Event handler for disconnection
        socket.on('disconnect', async () => {
            console.log('User disconnected');

            // Update the user's online status to false in the database
            const userId = await getUserIdFromSocketId(socket.id);
            if (userId) {
                await prisma.user.update({
                    where: { id: userId },
                    data: { isOnline: false },
                });

                // Remove the socket mapping from the database
                await prisma.socketMapping.delete({
                    where: { userId }
                });
            }
        });
    });

    return httpServer;

};

module.exports = setupSocketIO;

const getSocketIdFromUserId = async (userId) => {
    const socketMapping = await prisma.socketMapping.findUnique({
        where: { userId },
    });

    return socketMapping?.socketId || null;
};

const getUserIdFromSocketId = async (socketId) => {
    const socketMapping = await prisma.socketMapping.findUnique({
        where: { socketId },
    });

    return socketMapping?.userId || null;
};