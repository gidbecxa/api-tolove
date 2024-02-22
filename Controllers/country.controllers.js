const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

module.exports = {
    getAll: async (req, res) => {
        console.log("Fetching countries...");
        
        try {
            const countries = await prisma.country.findMany({
                select: {
                    id: true,
                    name: true,
                    sigle: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: {name: 'asc'}
            });

            res.status(200).send(countries);
        } catch (error) {
            res.status(500).send({
                message: error.message || `An error occurred`,
            });
        }
    },

    getOne: async (req, res) => {
        try {
            const { id } = req.params;

            const country = await prisma.country.findUnique({
                where: { id: parseInt(id) },
                select: {
                    id: true,
                    name: true,
                    sigle: true,
                    createdAt: true,
                    updatedAt: true,
                },
            });

            const statusCode = country ? 200 : 404;
            const response = country || { message: `Cannot find country with id = ${id}` };
            res.status(statusCode).send(response);
        } catch (error) {
            res.status(500).send({
                message: error.message || `Some error occurred while retrieving the country with id=${id}`,
            });
        }
    },

    searchCountry: async function (req, res) {
        const { inputvalue } = req.body;

        try {
            const data = await prisma.country.findMany({
                where: {
                    OR: [
                        { name: inputvalue, },
                        { name: '%' + inputvalue + '%', },
                        { sigle: inputvalue, },
                        { sigle: '%' + inputvalue + '%', },
                    ],
                },
                orderBy: {name: 'asc'}
            })

            res.json({ data });

        } catch (error) {
            console.error('Error occurred while querying countries table:', error);
            res.status(500).json({ error: 'An error occurred' });
        }

    },

    addCountry: async function (req, res) {
        // console.log("Request body:", req.body);
        const { name, sigle } = req.body;
        console.log("Attempting to add country:", { name, sigle });

        try {
            const existingCountry = await prisma.country.findFirst({
                where: {
                    name: name,
                },
            });

            if (existingCountry) {
                return res.status(422).send({ success: false, msg: 'Country with this name already exists' });
            }

            // Create a new country in the database
            const newCountry = await prisma.country.create({
                data: {
                    name: name,
                    sigle: sigle,
                },
            });

            return res.status(201).send({ success: true, msg: 'Country has been added successfully', country: newCountry });
        } catch (error) {
            console.error('Error while adding country:', error);
            res.status(500).json({ success: false, error: "Failed to add country" });
        }
    },

    updateCountry: async (req, res) => {

        const { id } = req.params;
        const { name, sigle, } = req.body;

        try {
            const existingCountry = await prisma.country.findFirst({
                where: {
                    name: name,
                },
            });

            if (existingCountry) {
                return res.status(422).send({ success: false, msg: 'Country with this name already exists' });
            }

            const country = await prisma.country.update({
                where: { id: parseInt(id) },
                data: {
                    name: name,
                    sigle: sigle,
                },
            });

            res.status(200).json({ success: true, country })
        } catch (error) {
            console.error("Error updating country infos: ", error);
            res.status(500).json({ success: false, error: "Failed to update country infos" })
        }
    },

    deleteCountry: async (req, res) => {

        const { id } = req.params

        const deleteCountry = Country.delete({
            where: {
                id: parseInt(id),
            },
        })

        prisma
            .$transaction([deleteCountry])
            .then(() => {
                res.status(200).send({
                    message: 'Country has been deleted successfully',
                })
            })
            .catch((error) => {
                res.status(500).send({
                    message: error.message || `Some error occurred while deleting the country with id=${id}`,
                })
            })
    },
}