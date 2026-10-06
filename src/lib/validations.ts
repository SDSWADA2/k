import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(6, "Password minimal 6 karakter"),
});

export const customerSchema = z.object({
  name: z.string().min(2, "Nama minimal 2 karakter"),
  phone: z.string().min(9, "Nomor HP minimal 9 digit").regex(/^[0-9+\s-]+$/, "Nomor HP hanya boleh berisi angka dan tanda +"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  address: z.string().optional(),
  notes: z.string().optional(),
});

export const vehicleSchema = z.object({
  plateNumber: z.string().min(3, "Nomor polisi minimal 3 karakter"),
  brand: z.string().min(1, "Merk kendaraan wajib diisi"),
  model: z.string().min(1, "Model kendaraan wajib diisi"),
  year: z.coerce.number().min(1980, "Tahun minimal 1980").max(new Date().getFullYear() + 1, "Tahun tidak valid").optional(),
  color: z.string().optional(),
  type: z.enum(["MOTOR", "MOBIL"]),
  chassisNumber: z.string().optional(),
  engineNumber: z.string().optional(),
  currentOdometer: z.coerce.number().min(0, "Kilometer tidak boleh minus").default(0),
  customerId: z.string().min(1, "Pelanggan harus dipilih"),
  notes: z.string().optional(),
});

export const mechanicSchema = z.object({
  name: z.string().min(2, "Nama mekanik minimal 2 karakter"),
  phone: z.string().min(9, "Nomor HP minimal 9 digit"),
  address: z.string().optional(),
  skills: z.string().optional(),
  commissionRate: z.coerce.number().min(0, "Komisi minimal 0%").max(100, "Komisi maksimal 100%").default(0),
});

export const partSchema = z.object({
  sku: z.string().min(2, "SKU wajib diisi"),
  barcode: z.string().optional(),
  name: z.string().min(2, "Nama spare part wajib diisi"),
  categoryId: z.string().min(1, "Kategori wajib dipilih"),
  brand: z.string().optional(),
  unit: z.string().default("PCS"),
  purchasePrice: z.coerce.number().min(0, "Harga beli tidak boleh minus"),
  sellPrice: z.coerce.number().min(0, "Harga jual tidak boleh minus"),
  stock: z.coerce.number().min(0, "Stok awal tidak boleh minus").default(0),
  minStock: z.coerce.number().min(0, "Stok minimal tidak boleh minus").default(5),
  supplierId: z.string().optional(),
  rackLocation: z.string().optional(),
});

export const serviceSchema = z.object({
  code: z.string().min(2, "Kode jasa wajib diisi"),
  name: z.string().min(2, "Nama jasa wajib diisi"),
  categoryId: z.string().min(1, "Kategori jasa wajib dipilih"),
  price: z.coerce.number().min(0, "Harga jasa tidak boleh minus"),
  estimatedMinutes: z.coerce.number().min(5, "Estimasi waktu minimal 5 menit").default(30),
  description: z.string().optional(),
});

export const supplierSchema = z.object({
  name: z.string().min(2, "Nama supplier wajib diisi"),
  pic: z.string().optional(),
  phone: z.string().min(9, "Nomor HP supplier wajib diisi"),
  email: z.string().email("Format email tidak valid").optional().or(z.literal("")),
  address: z.string().optional(),
  npwp: z.string().optional(),
  notes: z.string().optional(),
});

export const workOrderSchema = z.object({
  customerId: z.string().min(1, "Pelanggan harus dipilih"),
  vehicleId: z.string().min(1, "Kendaraan harus dipilih"),
  mechanicId: z.string().optional(),
  odometer: z.coerce.number().min(0, "Kilometer tidak boleh minus").default(0),
  customerComplaints: z.string().optional(),
  mechanicInspection: z.string().optional(),
  notes: z.string().optional(),
  services: z.array(z.object({
    serviceId: z.string(),
    name: z.string(),
    price: z.number().min(0),
    discount: z.number().min(0).default(0),
    qty: z.number().min(1).default(1),
  })).default([]),
  parts: z.array(z.object({
    partId: z.string(),
    name: z.string(),
    price: z.number().min(0),
    discount: z.number().min(0).default(0),
    qty: z.number().min(1).default(1),
  })).default([]),
});

export const checkoutSchema = z.object({
  customerId: z.string().optional(),
  vehicleId: z.string().optional(),
  customerName: z.string().optional(),
  vehiclePlate: z.string().optional(),
  mechanicId: z.string().optional(),
  items: z.array(z.object({
    type: z.enum(["SERVICE", "PART"]),
    id: z.string(),
    name: z.string(),
    price: z.number().min(0),
    qty: z.number().min(1),
    discount: z.number().min(0).default(0),
  })).min(1, "Keranjang transaksi tidak boleh kosong"),
  discountTotal: z.number().min(0).default(0),
  taxTotal: z.number().min(0).default(0),
  paidAmount: z.number().min(0, "Nominal bayar tidak boleh minus"),
  paymentMethod: z.enum(["CASH", "TRANSFER", "QRIS", "DEBIT_CARD", "CREDIT_CARD", "E_WALLET"]),
  notes: z.string().optional(),
});

export const expenseSchema = z.object({
  categoryId: z.string().min(1, "Kategori pengeluaran wajib dipilih"),
  date: z.string().min(1, "Tanggal wajib diisi"),
  description: z.string().min(2, "Deskripsi pengeluaran wajib diisi"),
  amount: z.coerce.number().min(100, "Nominal pengeluaran minimal Rp 100"),
  paymentMethod: z.string().default("CASH"),
});

export const purchaseSchema = z.object({
  supplierId: z.string().min(1, "Supplier wajib dipilih"),
  notes: z.string().optional(),
  items: z.array(z.object({
    partId: z.string().min(1, "Spare part harus dipilih"),
    name: z.string(),
    purchasePrice: z.number().min(0, "Harga beli tidak boleh minus"),
    qty: z.number().min(1, "Qty minimal 1"),
  })).min(1, "Minimal 1 barang harus dimasukkan"),
});
