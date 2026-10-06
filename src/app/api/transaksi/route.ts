import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/transaksi
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const skip = (page - 1) * limit;

  try {
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { nomorInvoice: { contains: search } },
        { pelanggan: { nama: { contains: search } } },
        { kendaraan: { nomorPolisi: { contains: search } } },
      ];
    }
    if (status) where.status = status;

    const [data, total] = await Promise.all([
      prisma.transaksi.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          pelanggan: { select: { nama: true, telepon: true } },
          kendaraan: { select: { nomorPolisi: true, merek: true, model: true } },
          kasir: { select: { nama: true } },
          _count: { select: { detail: true } },
        },
      }),
      prisma.transaksi.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("GET transaksi error:", error);
    return NextResponse.json({ error: "Gagal memuat transaksi" }, { status: 500 });
  }
}

// POST /api/transaksi — buat transaksi baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pelangganId,
      kendaraanId,
      kasirId,
      catatanKeluhan,
      detail, // Array of { tipe, sparePartId|jasaServiceId, mekanikId, nama, jumlah, hargaSatuan, diskon }
      diskon = 0,
      pajak = 0,
      metodePembayaran,
      dibayar = 0,
    } = body;

    // Generate invoice number
    const count = await prisma.transaksi.count();
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const nomorInvoice = `INV-${y}${m}${d}-${String(count + 1).padStart(4, "0")}`;

    // Calculate totals
    const subtotal = (detail as Array<{ jumlah: number; hargaSatuan: number; diskon?: number }>).reduce((sum, item) => {
      const itemSubtotal = item.jumlah * item.hargaSatuan * (1 - (item.diskon ?? 0) / 100);
      return sum + itemSubtotal;
    }, 0);

    const totalSetelahDiskon = subtotal * (1 - diskon / 100);
    const totalPajak = totalSetelahDiskon * (pajak / 100);
    const total = totalSetelahDiskon + totalPajak;
    const kembalian = Math.max(0, dibayar - total);

    const status = dibayar >= total ? "LUNAS" : metodePembayaran ? "SELESAI" : "ANTRI";

    const transaksi = await prisma.$transaction(async (tx) => {
      // Buat transaksi
      const t = await tx.transaksi.create({
        data: {
          nomorInvoice,
          pelangganId: pelangganId || null,
          kendaraanId: kendaraanId || null,
          kasirId: kasirId || null,
          catatanKeluhan,
          subtotal,
          diskon,
          pajak,
          total,
          dibayar,
          kembalian,
          status,
          metodePembayaran: metodePembayaran || null,
          detail: {
            create: (detail as Array<{
              tipe: string;
              sparePartId?: string;
              jasaServiceId?: string;
              mekanikId?: string;
              nama: string;
              jumlah: number;
              hargaSatuan: number;
              diskon?: number;
            }>).map((item) => ({
              tipe: item.tipe,
              sparePartId: item.sparePartId || null,
              jasaServiceId: item.jasaServiceId || null,
              mekanikId: item.mekanikId || null,
              nama: item.nama,
              jumlah: item.jumlah,
              hargaSatuan: item.hargaSatuan,
              diskon: item.diskon ?? 0,
              subtotal: item.jumlah * item.hargaSatuan * (1 - (item.diskon ?? 0) / 100),
            })),
          },
        },
        include: { detail: true },
      });

      // Kurangi stok spare part
      for (const item of (detail as Array<{ tipe: string; sparePartId?: string; jumlah: number }>) ) {
        if (item.tipe === "SPARE_PART" && item.sparePartId) {
          await tx.sparePart.update({
            where: { id: item.sparePartId },
            data: { stok: { decrement: item.jumlah } },
          });
        }
      }

      return t;
    });

    return NextResponse.json(transaksi, { status: 201 });
  } catch (error) {
    console.error("POST transaksi error:", error);
    return NextResponse.json({ error: "Gagal membuat transaksi" }, { status: 500 });
  }
}
