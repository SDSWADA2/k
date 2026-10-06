import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Menyiapkan seed data untuk Kasir Bengkel...");

  const hashedPassword = await bcrypt.hash("bengkel123", 10);

  // 1. Users
  const owner = await prisma.user.upsert({
    where: { email: "owner@bengkel.local" },
    update: {},
    create: {
      email: "owner@bengkel.local",
      password: hashedPassword,
      name: "Hendra Wijaya (Owner)",
      phone: "081234567890",
      role: "OWNER",
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: "admin@bengkel.local" },
    update: {},
    create: {
      email: "admin@bengkel.local",
      password: hashedPassword,
      name: "Siti Rahma (Admin/Kasir)",
      phone: "081298765432",
      role: "ADMIN",
    },
  });

  const mechanic = await prisma.user.upsert({
    where: { email: "mekanik@bengkel.local" },
    update: {},
    create: {
      email: "mekanik@bengkel.local",
      password: hashedPassword,
      name: "Budi Santoso (Mekanik)",
      phone: "081345678901",
      role: "MECHANIC",
    },
  });

  console.log("Users created:", { owner: owner.email, admin: admin.email, mechanic: mechanic.email });

  // 2. Settings
  await prisma.setting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      workshopName: "BENGKEL MOTOR & MOBIL PRO JAYA",
      address: "Jl. Raya Ahmad Yani No. 128, Surabaya, Jawa Timur",
      phone: "0812-3456-7890 / (031) 829988",
      email: "bengkelprojaya@gmail.com",
      invoicePrefix: "INV",
      taxRate: 0,
      currency: "Rp",
      operationalHours: "Senin - Sabtu: 08.00 - 17.00 WIB",
    },
  });

  console.log("Seed data selesai dengan sukses!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
