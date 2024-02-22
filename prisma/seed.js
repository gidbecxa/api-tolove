const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();
const { countries } = require('./countriesData');

async function main() {

    // COUNTRY SEED
    await prisma.country.createMany({
        data: countries,
    });
}

main()
.catch(e => {
  console.error(e)
  process.exit(1)
})
.finally(async () => {
  await prisma.$disconnect()
})
