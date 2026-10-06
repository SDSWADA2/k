import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/laporan/pendapatan?from=&to=
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const groupBy = searchParams.get("groupBy") ?? "day"; // day | month

  const startDate = from ? new Date(from) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const endDate = to ? new Date(to + "T23:59:59") : new Date();

  try {
    const transaksi = await prisma.transaksi.findMany({
      where: {
        tanggal: { gte: startDate, lte: endDate },
        status: "LUNAS",
      },
      select: { tanggal: true, total: true, subtotal: true, diskon: true, pajak: true },
      orderBy: { tanggal: "asc" },
    });

    // Group by day or month
    const grouped: Record<string, { label: string; total: number; count: number }> = {};

    for (const tx of transaksi) {
      const d = new Date(tx.tanggal);
      const key =
        groupBy === "month"
          ? `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`
          : `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

      if (!grouped[key]) {
        grouped[key] = { label: key, total: 0, count: 0 };
      }
      grouped[key].total += tx.total;
      grouped[key].count += 1;
    }

    const chartData = Object.values(grouped);
    const totalPendapatan = transaksi.reduce((s, t) => s + t.total, 0);
    const totalTransaksi = transaksi.length;

    return NextResponse.json({ chartData, totalPendapatan, totalTransaksi });
  } catch (error) {
    console.error("Laporan error:", error);
    return NextResponse.json({ error: "Gagal memuat laporan" }, { status: 500 });
  }
}
