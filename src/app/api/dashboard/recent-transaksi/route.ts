import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const transaksi = await prisma.transaksi.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: {
        pelanggan: { select: { nama: true } },
        kendaraan: { select: { nomorPolisi: true, merek: true, model: true } },
      },
    });

    const result = transaksi.map((tx) => ({
      id: tx.id,
      nomorInvoice: tx.nomorInvoice,
      pelanggan: tx.pelanggan?.nama ?? null,
      kendaraan: tx.kendaraan ? `${tx.kendaraan.nomorPolisi}` : null,
      total: tx.total,
      status: tx.status,
      tanggal: tx.tanggal.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Recent transaksi error:", error);
    return NextResponse.json([], { status: 500 });
  }
}
