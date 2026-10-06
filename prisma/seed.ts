import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Admin user
  const hashedPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@bengkel.com" },
    update: {},
    create: {
      nama: "Administrator",
      email: "admin@bengkel.com",
      password: hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("✅ User admin dibuat:", admin.email);

  // Kategori
  const kategoriOli = await prisma.kategori.upsert({
    where: { id: "kategori-oli" },
    update: {},
    create: { id: "kategori-oli", nama: "Oli & Pelumas", deskripsi: "Oli mesin, oli gardan, dll" },
  });
  const kategoriFilter = await prisma.kategori.upsert({
    where: { id: "kategori-filter" },
    update: {},
    create: { id: "kategori-filter", nama: "Filter", deskripsi: "Filter udara, filter oli, dll" },
  });
  const kategoriAki = await prisma.kategori.upsert({
    where: { id: "kategori-aki" },
    update: {},
    create: { id: "kategori-aki", nama: "Aki & Kelistrikan", deskripsi: "Aki, busi, lampu, dll" },
  });

  // Spare Part
  await prisma.sparePart.createMany({
    skipDuplicates: true,
    data: [
      { kode: "OLI-001", nama: "Oli Mesin Federal 0.8L", kategoriId: kategoriOli.id, hargaBeli: 35000, hargaJual: 45000, stok: 50, stokMinimum: 10, satuan: "botol" },
      { kode: "OLI-002", nama: "Oli Mesin Yamalube 1L", kategoriId: kategoriOli.id, hargaBeli: 45000, hargaJual: 60000, stok: 40, stokMinimum: 10, satuan: "botol" },
      { kode: "OLI-003", nama: "Oli Gardan Honda 0.1L", kategoriId: kategoriOli.id, hargaBeli: 10000, hargaJual: 15000, stok: 30, stokMinimum: 10, satuan: "botol" },
      { kode: "FLT-001", nama: "Filter Udara Mio", kategoriId: kategoriFilter.id, hargaBeli: 20000, hargaJual: 30000, stok: 25, stokMinimum: 5, satuan: "pcs" },
      { kode: "FLT-002", nama: "Filter Oli Vixion", kategoriId: kategoriFilter.id, hargaBeli: 25000, hargaJual: 38000, stok: 20, stokMinimum: 5, satuan: "pcs" },
      { kode: "AKI-001", nama: "Busi NGK CPR8EA", kategoriId: kategoriAki.id, hargaBeli: 28000, hargaJual: 40000, stok: 30, stokMinimum: 10, satuan: "pcs" },
      { kode: "AKI-002", nama: "Aki GS 12V 3.5Ah", kategoriId: kategoriAki.id, hargaBeli: 150000, hargaJual: 200000, stok: 10, stokMinimum: 3, satuan: "pcs" },
    ],
  });
  console.log("✅ Spare part dibuat");

  // Jasa Service
  await prisma.jasaService.createMany({
    skipDuplicates: true,
    data: [
      { kode: "JSR-001", nama: "Ganti Oli Mesin", harga: 25000, estimasiJam: 0.5 },
      { kode: "JSR-002", nama: "Tune Up Ringan", harga: 75000, estimasiJam: 1 },
      { kode: "JSR-003", nama: "Tune Up Berat", harga: 150000, estimasiJam: 2 },
      { kode: "JSR-004", nama: "Servis Karburator", harga: 50000, estimasiJam: 1 },
      { kode: "JSR-005", nama: "Ganti Ban Depan", harga: 20000, estimasiJam: 0.5 },
      { kode: "JSR-006", nama: "Ganti Ban Belakang", harga: 25000, estimasiJam: 0.5 },
      { kode: "JSR-007", nama: "Servis Rem", harga: 40000, estimasiJam: 1 },
      { kode: "JSR-008", nama: "Ganti Aki", harga: 25000, estimasiJam: 0.5 },
    ],
  });
  console.log("✅ Jasa service dibuat");

  // Mekanik
  await prisma.mekanik.createMany({
    skipDuplicates: true,
    data: [
      { kode: "MKN-001", nama: "Budi Santoso", telepon: "081234567891", spesialisasi: "Motor Matic" },
      { kode: "MKN-002", nama: "Agus Purnomo", telepon: "081234567892", spesialisasi: "Motor Manual" },
      { kode: "MKN-003", nama: "Rudi Hartono", telepon: "081234567893", spesialisasi: "Kelistrikan" },
    ],
  });
  console.log("✅ Mekanik dibuat");

  // Supplier
  await prisma.supplier.createMany({
    skipDuplicates: true,
    data: [
      { nama: "PT Astra Honda Motor", telepon: "021-12345678", email: "supplier@ahm.co.id", alamat: "Jakarta" },
      { nama: "CV Mandiri Spare Part", telepon: "0274-9876543", email: "mandiri@sparepart.com", alamat: "Yogyakarta" },
    ],
  });
  console.log("✅ Supplier dibuat");

  // Pelanggan contoh
  const pelanggan1 = await prisma.pelanggan.upsert({
    where: { kode: "PLG-001" },
    update: {},
    create: { kode: "PLG-001", nama: "Budi Raharjo", telepon: "081234567001", alamat: "Jl. Mawar No. 1, Surabaya", tipe: "MEMBER", poin: 150 },
  });
  const pelanggan2 = await prisma.pelanggan.upsert({
    where: { kode: "PLG-002" },
    update: {},
    create: { kode: "PLG-002", nama: "Siti Aisyah", telepon: "081234567002", alamat: "Jl. Melati No. 5, Surabaya", tipe: "UMUM" },
  });

  // Kendaraan contoh
  await prisma.kendaraan.upsert({
    where: { nomorPolisi: "L 1234 AB" },
    update: {},
    create: {
      pelangganId: pelanggan1.id,
      nomorPolisi: "L 1234 AB",
      merek: "Honda",
      model: "Beat",
      tahun: 2021,
      warna: "Merah",
      jenis: "MOTOR",
    },
  });
  await prisma.kendaraan.upsert({
    where: { nomorPolisi: "L 5678 CD" },
    update: {},
    create: {
      pelangganId: pelanggan2.id,
      nomorPolisi: "L 5678 CD",
      merek: "Yamaha",
      model: "Mio",
      tahun: 2020,
      warna: "Putih",
      jenis: "MOTOR",
    },
  });
  console.log("✅ Pelanggan & kendaraan dibuat");

  // Pengaturan bengkel
  await prisma.pengaturan.createMany({
    skipDuplicates: true,
    data: [
      { kunci: "nama_bengkel", nilai: "Bengkel Motor Maju Jaya" },
      { kunci: "alamat_bengkel", nilai: "Jl. Raya Darmo No. 100, Surabaya" },
      { kunci: "telepon_bengkel", nilai: "031-1234567" },
      { kunci: "email_bengkel", nilai: "info@bengkelmajujaya.com" },
      { kunci: "pajak_persen", nilai: "0" },
      { kunci: "footer_invoice", nilai: "Terima kasih atas kepercayaan Anda. Garansi servis 7 hari." },
    ],
  });
  console.log("✅ Pengaturan bengkel dibuat");

  console.log("🎉 Seeding selesai!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
