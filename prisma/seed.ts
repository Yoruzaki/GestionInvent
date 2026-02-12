const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  await prisma.user.upsert({
    where: { email: "admin@etablissement.local" },
    update: {},
    create: {
      name: "Administrateur",
      email: "admin@etablissement.local",
      password: "admin123",
      role: "admin",
    },
  });

  const loc = await prisma.location.findFirst() ?? await prisma.location.create({
    data: { name: "Bureau directeur", officeNumber: "101", building: "Bâtiment A" },
  });

  const emp = await prisma.employee.findFirst() ?? await prisma.employee.create({
    data: { name: "Ahmed Benali", position: "Directeur", department: "Direction" },
  });

  let prod = await prisma.product.findFirst();
  if (!prod) {
    prod = await prisma.product.create({
      data: { name: "Papier A4", category: "bureau", unit: "rame", minimumThreshold: 10 },
    });
    await prisma.stockEntry.create({
      data: { productId: prod.id, quantity: 50, supplier: "Fournisseur Bureau", invoiceNumber: "FAC-2025-001" },
    });
  }

  console.log("Seed terminé.");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => {
    console.error(e);
    prisma.$disconnect();
    process.exit(1);
  });
