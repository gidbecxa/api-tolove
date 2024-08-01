const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

module.exports = {
         
    getWorldPodiumUser: async (req, res) => {
        try {
            const podiumUsers = await prisma.podium.findFirst({
                where: {
                    category: 'WORLD',
                    status: 'none',
                },
                select: {
                    id: true,
                    userId: true,
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });
    
            // No users found, return a 404 response
            if (!podiumUsers) {
                return res.status(404).send({ message: 'No users found on the world podium' });
            }
    
            const selectedPodium = await prisma.podium.update({
                where: {
                    userId: podiumUsers.userId,
                },
                data: {
                    status: 'isOn',
                },
            });
    
            const selectedUser = await prisma.user.findUnique({
                where: { id: selectedPodium.userId },
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
    
            // User not found, return a 404 response
            if (!selectedUser) {
                return res.status(404).send({ message: 'User not found' });
            }
    
            return res.status(200).send(selectedUser);
        } catch (error) {
            res.status(500).send({
                message: error.message || 'An error occurred',
            });
        }
    },
        
    getCountryPodiumUser: async (req, res) => {
        const { id } = req.params;
    
        try {
            const user = await prisma.user.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    pays: true,
                },
            });
    
            // User not found, return a 404 response
            if (!user) {
                return res.status(404).send({ message: `Cannot find user with id = ${id}` });
            }
    
            // Fetch the first user on the podium in the same country
            const podiumUser = await prisma.podium.findFirst({
                where: {
                    category: 'COUNTRY',
                    pays: user.pays,
                    status: 'none',
                },
                select: {
                    id: true,
                    userId: true,
                },
                orderBy: {
                    createdAt: 'asc',
                },
            });
    
            // No podium user found, return a 404 response
            if (!podiumUser) {
                return res.status(404).send({ message: 'No users found on the country podium' });
            }
    
            // Update the status of the selected podium user to "isOn"
            const selectedPodium = await prisma.podium.update({
                where: {
                    userId: podiumUser.userId,
                },
                data: {
                    status: 'isOn',
                },
            });
    
            // Fetch the details of the selected podium user
            const selectedUser = await prisma.user.findUnique({
                where: { id: selectedPodium.userId },
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
    
            // If the user is not found, return a 404 response
            if (!selectedUser) {
                return res.status(404).send({ message: 'User not found' });
            }
    
            return res.status(200).send(selectedUser);
        } catch (error) {
            res.status(500).send({
                message: error.message || 'An error occurred',
            });
        }
    },

    getStarPodium: async (req, res) => {
        const { id } = req.params;
        const limit = parseInt(req.query.limit) || 10;
        const page = parseInt(req.query.page) || 0; 
    
        try {
            const podiumStars = await prisma.podium.groupBy({
                by: ['pays'],
                _count: {
                    pays: true,
                },
                orderBy: {
                    _count: {
                        pays: 'desc',
                    },
                },
                take: limit,
                skip: limit * page,
            });
    
            // Fetch user details for each grouped podium star
            const podiumWithUserDetails = await Promise.all(podiumStars.map(async (podiumStar) => {
                const userDetails = await prisma.user.findUnique({
                    where: { id: podiumStar.userId },
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
    
                return {
                    ...podiumStar,
                    user: userDetails,
                };
            }));
    
            return res.status(200).send(podiumWithUserDetails);
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

    addWorldPodiumUser: async (req, res) => {
        const { id } = req.params;
        const userId = parseInt(id);
    
        try {
            // GET USER COINS BEFORE
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    coins: true,
                }
            });
    
            if (!user) {
                return res.status(404).send({ message: `Cannot find user with id = ${id}` });
            }
    
            // GET ALL ONLINE, LOCKED USERS
            const allOnlineUsers = await prisma.user.findMany({ where: { isOnline: true } });
            const allOnlineAndLockedUsers = await prisma.user.findMany({
                where: {
                    isOnline: true,
                    isLockEnabled: true,
                }
            });
    
            const amountToCheck = allOnlineUsers.length - allOnlineAndLockedUsers.length;
    
            // CHECK IF USER COINS IS ENOUGH
            if (user.coins >= amountToCheck) {
                // CHECK IF USER IS ALREADY IN PODIUM TABLE
                const existingPodiumUser = await prisma.podium.findFirst({ where: { userId: user.id } });
    
                let response;
                let statusCode = 201;
    
                if (existingPodiumUser) {
                    // Update the existing record with the new category and status
                    const updatedPodiumUser = await prisma.podium.update({
                        where: { id: existingPodiumUser.id },
                        data: {
                            category: "WORLD",
                            status: "none",
                        }
                    });
    
                    // INCREMENT podiumOccurenceCount Field for this User
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            podiumOccurenceCount: { increment: 1 }
                        }
                    });
    
                    response = {
                        success: true,
                        msg: 'User has been added successfully to World Podium',
                        user: updatedPodiumUser
                    };
                } else {
                    // Create a new record
                    const updatedPodiumUser = await prisma.podium.create({
                        data: {
                            userId: user.id,
                            category: "WORLD"
                        }
                    });
    
                    // INCREMENT podiumOccurenceCount Field for this User
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            podiumOccurenceCount: { increment: 1 }
                        }
                    });
    
                    response = {
                        success: true,
                        msg: 'User has been added successfully to World Podium',
                        user: updatedPodiumUser
                    };
                }
    
                // RETURN THE APPROPRIATE RESPONSE
                return res.status(statusCode).send(response);
    
            } else {
                return res.status(500).send({ message: `You don't have enough coins to be added to World Podium` });
            }
    
        } catch (error) {   
            return res.status(500).send({
                message: error.message || `An error occurred`,
            });
        }
    },

    addCountryPodiumUser: async (req, res) => {
        const { id } = req.params;
        const userId = parseInt(id);
    
        try {
            // GET USER COINS BEFORE
            const user = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                    coins: true,
                }
            });
    
            if (!user) {
                return res.status(404).send({ message: `Cannot find user with id = ${id}` });
            }
    
            // GET ALL ONLINE, LOCKED USERS IN THE USER'S COUNTRY
            const allOnlineUsers = await prisma.user.findMany({ where: { pays: user.pays, isOnline: true } });
            const allOnlineAndLockedUsers = await prisma.user.findMany({
                where: {
                    isOnline: true,
                    isLockEnabled: true,
                    // pays: user.pays  // MIGHT NEED TO ADD THIS LINE!
                }
            });
    
            const amountToCheck = allOnlineUsers.length - allOnlineAndLockedUsers.length;
    
            // CHECK IF USER COINS IS ENOUGH
            if (user.coins >= amountToCheck) {
                // CHECK IF USER IS ALREADY IN PODIUM TABLE
                const existingPodiumUser = await prisma.podium.findFirst({ where: { userId: user.id } });
    
                let response;
                let statusCode = 201;
    
                if (existingPodiumUser) {
                    // Update the existing record with the new category and status
                    const updatedPodiumUser = await prisma.podium.update({
                        where: { id: existingPodiumUser.id },
                        data: {
                            pays: user.pays,
                            category: "COUNTRY",
                            status: "none",
                        }
                    });
    
                    // INCREMENT podiumOccurenceCount Field for this User
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            podiumOccurenceCount: { increment: 1 }
                        }
                    });
    
                    response = {
                        success: true,
                        msg: 'User has been added successfully to Country Podium',
                        user: updatedPodiumUser
                    };
                } else {
                    // Create a new record
                    const updatedPodiumUser = await prisma.podium.create({
                        data: {
                            userId: user.id,
                            pays: user.pays,
                            category: "COUNTRY",
                        }
                    });
    
                    // INCREMENT podiumOccurenceCount Field for this User
                    await prisma.user.update({
                        where: { id: userId },
                        data: {
                            podiumOccurenceCount: { increment: 1 }
                        }
                    });
    
                    response = {
                        success: true,
                        msg: 'User has been added successfully to Country Podium',
                        user: updatedPodiumUser
                    };
                }
    
                // RETURN THE APPROPRIATE RESPONSE
                return res.status(statusCode).send(response);
    
            } else {
                return res.status(500).send({ message: `You don't have enough coins to be added to World Podium` });
            }
    
        } catch (error) {   
            return res.status(500).send({
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

    removeUserFromPodium: async (req, res) => {
        const { id } = req.params;
        const userId = parseInt(id);
    
        try {
            // CHECK IF THE USER EXISTS
            const currentUserOnPodium = await prisma.user.findUnique({
                where: { id: userId },
                select: {
                    id: true,
                },
            });
    
            if (!currentUserOnPodium) {
                return res.status(404).send({ message: `Cannot find user with id = ${id}` });
            }
    
            // UPDATE USER'S PODIUM STATUS
            const podium = await prisma.podium.update({
                where: {
                    userId: userId,
                },
                data: {
                    status: "isAlreadyPassed",
                }
            });
    
            if (podium) {
                return res.status(201).send({
                    success: true,
                    msg: 'Podium updated successfully',
                });
            } else {
                return res.status(500).send({
                    message: `An error occurred while updating the podium`,
                });
            }
    
        } catch (error) {
            return res.status(500).send({
                message: error.message || `Some error occurred while retrieving the user with id=${id}`,
            });
        }
    }    

}