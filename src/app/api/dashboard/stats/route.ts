import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      pendapatanHariIni,
      totalTransaksiHariIni,
      transaksiPending,
      pelangganBaru,
      stokKritis,
      pendapatanBulanIni,
    ] = await Promise.all([
      prisma.transaksi.aggregate({
        where: { tanggal: { gte: startOfDay }, status: "LUNAS" },
        _sum: { total: true },
      }),
      prisma.transaksi.count({
        where: { tanggal: { gte: startOfDay }, status: { not: "BATAL" } },
      }),
      prisma.transaksi.count({
        where: { status: { in: ["ANTRI", "PROSES"] } },
      }),
      prisma.pelanggan.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      // Stok kritis: cari yang stok <= stokMinimum menggunakan raw workaround
      prisma.$queryRaw<Array<{ count: bigint }>>`
        SELECT COUNT(*) as count FROM spare_part
        WHERE stok <= stokMinimum AND aktif = 1
      `,
      prisma.transaksi.aggregate({
        where: { tanggal: { gte: startOfMonth }, status: "LUNAS" },
        _sum: { total: true },
      }),
    ]);

    return NextResponse.json({
      pendapatanHariIni: pendapatanHariIni._sum.total ?? 0,
      totalTransaksiHariIni,
      transaksiPending,
      pelangganBaru,
      stokKritis: Number((stokKritis as Array<{ count: bigint }>)[0]?.count ?? 0),
      pendapatanBulanIni: pendapatanBulanIni._sum.total ?? 0,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json({ error: "Gagal memuat statistik" }, { status: 500 });
  }
}
