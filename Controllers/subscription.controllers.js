const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

module.exports = {
    getAll: async (req, res) => {
        try {
            const subscriptions = await prisma.subscription.findMany({
                select: {
                    id: true,
                    name: true,
                    description: true,
                    status: true,
                    price: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: {name: 'asc'}
            });

            res.status(200).send(subscriptions);
        } catch (error) {
            res.status(500).send({
                message: error.message || `An error occurred`,
            });
        }
    },

    getOne: async (req, res) => {
        try {
            const { id } = req.params;

            const subscription = await prisma.subscription.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    name: true,
                    description: true,
                    status: true,
                    price: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            const statusCode = subscription ? 200 : 404;
            const response = subscription || { message: `Cannot find subscription with id = ${id}` };
            res.status(statusCode).send(response);
        } catch (error) {
            res.status(500).send({
                message: error.message || `Some error occurred while retrieving the subscription with id=${id}`,
            });
        }
    },

    searchSubscription: async function (req, res) {
        const { inputvalue } = req.body;

        try {
            const data = await prisma.subscription.findMany({
                where: {
                    OR: [
                        { name: inputvalue, },
                        { name: '%' + inputvalue + '%', },
                        { description: inputvalue, },
                        { description: '%' + inputvalue + '%', },
                        { status: inputvalue, },
                        { status: '%' + inputvalue + '%', },
                    ],
                },
                orderBy: {name: 'asc'}
            })

            res.json({ data });

        } catch (error) {
            console.error('Error occurred while querying subscriptions table:', error);
            res.status(500).json({ error: 'An error occurred' });
        }

    },

    addSubscription: async function (req, res) {
        // console.log("Request body:", req.body);
        const { name, description, status, price } = req.body;
        console.log("Attempting to add subscription:", { name,description, status, price });

        try {
            const existingSubscription = await prisma.subscription.findFirst({
                where: {
                    OR: [
                        { name: name,},
                        { status: status }
                    ]
                },
            });

            if (existingSubscription) {
                return res.status(422).send({ success: false, msg: 'Subscription with this name already exists' });
            }

            // Create a new subscription in the database
            const newSubscription = await prisma.subscription.create({
                data: {
                    name: name,
                    description: description,
                    status: status,
                    price: price,
                },
            });

            return res.status(201).send({ success: true, msg: 'Subscription has been added successfully', subscription: newSubscription });
        } catch (error) {
            console.error('Error while adding subscription:', error);
            res.status(500).json({ success: false, error: "Failed to add subscription" });
        }
    },

    updateSubscription: async (req, res) => {

        const { id } = req.params;
        const { name, description, status, price } = req.body;

        try {
            const existingSubscription = await prisma.subscription.findFirst({
                where: {
                    name: name,
                },
            });

            if (existingSubscription) {
                return res.status(422).send({ success: false, msg: 'Subscription with this name already exists' });
            }

            const subscription = await prisma.subscription.update({
                where: { id: parseInt(id) },
                data: {
                    name: name,
                    description: description,
                    status: status,
                    price: price,
                },
            });

            res.status(200).json({ success: true, subscription })
        } catch (error) {
            console.error("Error updating subscription infos: ", error);
            res.status(500).json({ success: false, error: "Failed to update subscription" })
        }
    },

    deleteSubscription: async (req, res) => {

        const { id } = req.params
        try {
            const deleteSubscription = await prisma.subscription.delete({
                where: {
                    id: parseInt(id),
                },
            })

            const statusCode = deleteSubscription ? 200 : 404;
            const response = deleteSubscription || { message: `Cannot delete Subscription with id = ${id}` };
            res.status(statusCode).send(response);
        } catch (error) {
            res.status(500).send({
                message: error.message || `Some error occurred while deleting the Subscription with id=${id}`,
            });
        }
    },
}