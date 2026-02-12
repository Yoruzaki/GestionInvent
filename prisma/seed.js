const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const prisma = new PrismaClient();

async function main() {
  let loc = await prisma.location.findFirst();
  if (!loc) {
    loc = await prisma.location.create({
      data: { name: "Bureau directeur", officeNumber: "101", building: "Bâtiment A" },
    });
  }

  let emp = await prisma.employee.findFirst();
  if (!emp) {
    emp = await prisma.employee.create({
      data: { name: "Ahmed Benali", position: "Directeur", department: "Direction" },
    });
  }

  const adminHash = await bcrypt.hash("admin123", 10);
  const userHash = await bcrypt.hash("user123", 10);
  await prisma.user.upsert({
    where: { email: "admin@etablissement.local" },
    update: { password: adminHash },
    create: {
      name: "Administrateur",
      email: "admin@etablissement.local",
      password: adminHash,
      role: "admin",
    },
  });
  await prisma.user.upsert({
    where: { email: "user@etablissement.local" },
    update: { password: userHash, employeeId: emp.id },
    create: {
      name: emp.name,
      email: "user@etablissement.local",
      password: userHash,
      role: "user",
      employeeId: emp.id,
    },
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
