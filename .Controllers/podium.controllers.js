const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

module.exports = {
         
    getWorldUsersPodium: async (req, res) => {
        try {
            const users = await prisma.podium.findMany({
                where: { 
                    status: WORLD,
                },
                select: {
                    id: true,
                    userId: true,
                    user: {
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
                        }
                    },
                    status: true,
                },
                cacheStrategy: {
                    ttl: 60,
                    swr: 60,
                },
            });

            return res.status(200).send(users);
        } catch (error) {
            res.status(500).send({
                message: error.message || `An error occurred`,
            });
        }
    },
        
    getCountryUsersPodium: async (req, res) => {
        try {
            const users = await prisma.podium.findMany({
                where: { 
                    status: COUNTRY,
                },
                select: {
                    id: true,
                    userId: true,
                    user: {
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
                        }
                    },
                    status: true,
                },
                cacheStrategy: {
                    ttl: 60,
                    swr: 60,
                },
            });

            return res.status(200).send(users);
        } catch (error) {
            res.status(500).send({
                message: error.message || `An error occurred`,
            });
        }
    },

    getOnlineUsers: async (req, res) => {
        try {
            const users = await prisma.user.findMany({
                where: { isOnline: true },
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
    
    getOnlineUsersInSameCountry: async (req, res) => {
        const { id } = req.params;

        try {
            const user = await prisma.user.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    coins: true,
                },
            });

            if(!user) {
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

    addUserToWorldPodium: async (req, res) => {
        const { id } = req.params;

        try {
            // GET USER COINS BEFORE
            const user = await prisma.user.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    coins: true,
                }
            });

            if(!user) {
                return res.status(404).send({ message: `Cannot find user with id = ${id}` });
            }

            // GET ALL ONLINE USERS
            const allOnlineUsers = await prisma.user.findMany({
                where: { isOnline: true },
                select: {
                    id: true,
                },
            });

            let response;
            let statusCode;

            // CHECK IF USER COINS IS ENOUGH
            if(user.coins === allOnlineUsers.length) {
                const addedUser = await prisma.podium.create({
                    data: {
                        userId: user.id,
                        status: WORLD
                    },
                });
                statusCode = 201;
                response = { success: true, msg: 'User has been added successfully to World Podium', user: addedUser };
            } else {
                statusCode = 500;
                response = { message: `You don't have a lot of coins to be added to World Podium` };
            }

            // RETURN THE APROPRIATED RESPONSE
            return res.status(statusCode).send(response);

        } catch (error) {
            res.status(500).send({
                message: error.message || `An error occurred`,
            });
        }
    },

    addUserToCountryPodium: async (req, res) => {
        const { id } = req.params;

        try {
            // GET USER COINS BEFORE
            const user = await prisma.user.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    coins: true,
                },
            });

            if(!user) {
                res.status(404).send({ message: `Cannot find user with id = ${id}` });
            }

            // GET ALL ONLINE USERS IN THE COUNTRY
            const allOnlineUsers = await prisma.user.findMany({
                where: { 
                    pays: user.pays,
                    isOnline: true 
                },
                select: {
                    id: true,
                },
            });

            let response;
            let statusCode;

            // CHECK IF USER COINS IS ENOUGH
            if(user.coins === allOnlineUsers.length) {
                const addedUser = await prisma.podium.create({
                    data: {
                        userId: user.id,
                        status: COUNTRY
                    }
                });
                statusCode = 201;
                response = { success: true, msg: 'User has been added successfully to Country Podium', user: addedUser };
            } else {
                statusCode = 500;
                response = { message: `You don't have a lot of coins to be added to Country Podium` };
            }

            // RETURN THE APROPRIATED RESPONSE
            return res.status(statusCode).send(response);

        } catch (error) {
            res.status(500).send({
                message: error.message || `An error occurred`,
            });
        }
    },
     
    checkIfUserIsOnPodium: async (req, res) => {
        // CHECKING
        const { id } = req.params;

        try {
            const user = await prisma.podium.findFirst({
                where: {
                    userId: id,
                },
                select: {
                    id: true,
                    userId: true,
                    user: {
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
                        }
                    },
                    status: true,
                }
            });

            let statusCode;
            let response;

            if(user) {
                statusCode = 201;
                response = { success: true, msg: 'User is already on Podium', user: user };
            } else {
                statusCode = 500;
                response = { message: `User is not on Podium` };
            }
            
            // RETURN THE APROPRIATED RESPONSE
            return res.status(statusCode).send(response);

        } catch (error) {
            res.status(500).send({
                message: error.message || `Some error occurred while retrieving the user with id=${id}`,
            });
        }
    },

}