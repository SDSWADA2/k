# 🔧 KasirBengkel - Workshop Management System

Aplikasi kasir dan manajemen bengkel motor/mobil berbasis **Next.js 14**, **Prisma ORM**, **SQLite**, dan **Tailwind CSS**.

---

## 📋 Fitur Utama

- ✅ **Dashboard** — statistik pendapatan, transaksi pending, stok kritis
- ✅ **Kasir / POS** — pencarian pelanggan, tambah spare part & jasa ke keranjang, diskon, pembayaran
- ✅ **Riwayat Transaksi** — filter status, update status (Antri→Proses→Selesai→Lunas), batal transaksi
- ✅ **Invoice** — cetak struk thermal (optimized untuk printer 80mm)
- ✅ **Pelanggan** — CRUD, tipe (Umum/Member/VIP), poin
- ✅ **Kendaraan** — data kendaraan per pelanggan
- ✅ **Spare Part** — manajemen stok, stok kritis, kategori
- ✅ **Jasa Service** — daftar harga jasa
- ✅ **Mekanik** — data teknisi bengkel
- ✅ **Laporan Pendapatan** — grafik harian/bulanan

---

## 🚀 Setup & Instalasi

### Prasyarat
- Node.js 18+ 
- npm atau pnpm

### Langkah Instalasi

```bash
# 1. Masuk ke folder proyek
cd E:\Kasir

# 2. Install dependencies
npm install

# 3. Copy file environment
copy .env.example .env

# 4. Generate Prisma client & buat database SQLite
npx prisma db push

# 5. Isi data sample (spare part, mekanik, pelanggan, dll)
npm run db:setup

# 6. Jalankan server development
npm run dev
```

Buka browser: **http://localhost:3000**

### Login Default
| Email | Password | Role |
|-------|----------|------|
| admin@bengkel.com | admin123 | Admin |

---

## 📁 Struktur Proyek

```
E:\Kasir\
├── prisma/
│   ├── schema.prisma       # Schema database
│   └── seed.ts             # Data awal
├── src/
│   ├── app/
│   │   ├── api/            # API Routes (REST)
│   │   │   ├── dashboard/
│   │   │   ├── pelanggan/
│   │   │   ├── kendaraan/
│   │   │   ├── spare-part/
│   │   │   ├── jasa-service/
│   │   │   ├── mekanik/
│   │   │   ├── transaksi/
│   │   │   ├── laporan/
│   │   │   └── kategori/
│   │   ├── dashboard/      # Halaman Dashboard
│   │   ├── kasir/          # Halaman POS
│   │   ├── transaksi/      # Riwayat + Invoice
│   │   ├── pelanggan/      # CRUD Pelanggan
│   │   ├── spare-part/     # Manajemen Spare Part
│   │   ├── jasa-service/   # Manajemen Jasa
│   │   ├── mekanik/        # Manajemen Mekanik
│   │   └── laporan/        # Laporan
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── Badge.tsx
│   │       └── Card.tsx
│   └── lib/
│       ├── prisma.ts       # Prisma client singleton
│       └── utils.ts        # Utilities (formatRupiah, dll)
├── .env                    # Environment variables
├── package.json
├── prisma/schema.prisma
├── next.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🛠️ Stack Teknologi

| Layer | Teknologi |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | SQLite (development), PostgreSQL (production) |
| ORM | Prisma 5 |
| Styling | Tailwind CSS 3 |
| UI Components | Custom (Button, Input, Modal, Badge, Card) |
| Notifikasi | react-hot-toast |
| Grafik | Recharts |
| Bahasa | TypeScript |

---

## ⚙️ Environment Variables

```env
DATABASE_URL="file:./dev.db"
NEXTAUTH_SECRET="your-secret-key-here"
NEXTAUTH_URL="http://localhost:3000"
```

---

## 🖨️ Cetak Invoice

Invoice dioptimalkan untuk **printer thermal 80mm**. Setelah transaksi selesai, halaman invoice otomatis terbuka di tab baru. Klik tombol **Cetak Invoice** atau gunakan `Ctrl+P`.

---

## 📊 Laporan

Laporan pendapatan dapat diakses di menu **Laporan** dengan filter:
- Rentang tanggal kustom
- Grup per hari atau per bulan
- Export ke Excel (tersedia)
