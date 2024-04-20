const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

module.exports = {
    getAll: async (req, res) => {
        try {
            const cities = await prisma.city.findMany({
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: {name: 'asc'}
            });

            res.status(200).send(cities);
        } catch (error) {
            res.status(500).send({
                message: error.message || `An error occurred`,
            });
        }
    },

    getOne: async (req, res) => {
        try {
            const { id } = req.params;

            const city = await prisma.city.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    name: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            const statusCode = city ? 200 : 404;
            const response = city || { message: `Cannot find city with id = ${id}` };
            res.status(statusCode).send(response);
        } catch (error) {
            res.status(500).send({
                message: error.message || `Some error occurred while retrieving the city with id=${id}`,
            });
        }
    },

    searchCity: async function (req, res) {
        const { inputvalue } = req.body;

        try {
            const data = await prisma.city.findMany({
                where: {
                    OR: [
                        { name: inputvalue, },
                        { name: '%' + inputvalue + '%', },
                    ],
                },
                orderBy: {name: 'asc'}
            })

            res.json({ data });

        } catch (error) {
            console.error('Error occurred while querying cities table:', error);
            res.status(500).json({ error: 'An error occurred' });
        }

    },

    addCity: async function (req, res) {
        // console.log("Request body:", req.body);
        const { name, } = req.body;
        console.log("Attempting to add city:", { name, });

        try {
            const existingCity = await prisma.city.findFirst({
                where: {
                    name: name,
                },
            });

            if (existingCity) {
                return res.status(422).send({ success: false, msg: 'City with this name already exists' });
            }

            // Create a new city in the database
            const newCity = await prisma.city.create({
                data: {
                    name: name,
                },
            });

            return res.status(201).send({ success: true, msg: 'City has been added successfully', city: newCity });
        } catch (error) {
            console.error('Error while adding city:', error);
            res.status(500).json({ success: false, error: "Failed to add city" });
        }
    },

    updateCity: async (req, res) => {

        const { id } = req.params;
        const { name, } = req.body;

        try {
            const existingCity = await prisma.city.findFirst({
                where: {
                    name: name,
                },
            });

            if (existingCity) {
                return res.status(422).send({ success: false, msg: 'City with this name already exists' });
            }

            const city = await prisma.city.update({
                where: { id: parseInt(id) },
                data: {
                    name: name,
                },
            });

            res.status(200).json({ success: true, city })
        } catch (error) {
            console.error("Error updating city infos: ", error);
            res.status(500).json({ success: false, error: "Failed to update city infos" })
        }
    },

    deleteCity: async (req, res) => {

        const { id } = req.params

        const deleteCity = City.delete({
            where: {
                id: parseInt(id),
            },
        })

        prisma
            .$transaction([deleteCity])
            .then(() => {
                res.status(200).send({
                    message: 'City has been deleted successfully',
                })
            })
            .catch((error) => {
                res.status(500).send({
                    message: error.message || `Some error occurred while deleting the city with id=${id}`,
                })
            })
    },
}