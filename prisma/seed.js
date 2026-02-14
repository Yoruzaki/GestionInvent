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
    update: { password: adminHash, allowedProductTypes: null },
    create: {
      name: "Administrateur",
      email: "admin@etablissement.local",
      password: adminHash,
      role: "admin",
      allowedProductTypes: null, // null = tous les types
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

  let catBureau = await prisma.productCategory.findFirst({ where: { name: "Bureautique" } });
  if (!catBureau) catBureau = await prisma.productCategory.create({ data: { name: "Bureautique", productType: "consumable" } });
  let catInfo = await prisma.productCategory.findFirst({ where: { name: "Informatique" } });
  if (!catInfo) catInfo = await prisma.productCategory.create({ data: { name: "Informatique", productType: "equipment" } });
  let prod = await prisma.product.findFirst();
  if (!prod) {
    prod = await prisma.product.create({
      data: { name: "Papier A4", productType: "consumable", category: catBureau.name, categoryId: catBureau.id, unit: "rame", minimumThreshold: 10 },
    });
    await prisma.stockEntry.create({
      data: { productId: prod.id, quantity: 50, supplier: "Fournisseur Bureau", invoiceNumber: "FAC-2025-001" },
    });
    const pc = await prisma.product.create({
      data: { name: "Ordinateur portable", productType: "equipment", category: catInfo.name, categoryId: catInfo.id, unit: "unité", minimumThreshold: 0 },
    });
    await prisma.stockEntry.create({
      data: { productId: pc.id, quantity: 5, supplier: "Fournisseur IT", invoiceNumber: "IT-2025-001" },
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
