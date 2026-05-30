const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.deleteMany({});
  console.log(`Deleted ${result.count} users.`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
