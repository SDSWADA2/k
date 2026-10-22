import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/kendaraan/[id]/riwayat
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const transaksi = await prisma.transaksi.findMany({
      where: { kendaraanId: params.id },
      orderBy: { tanggal: "desc" },
      take: 10,
      include: {
        detail: {
          include: {
            sparePart: { select: { nama: true } },
            jasaService: { select: { nama: true } },
            mekanik: { select: { nama: true } },
          },
        },
      },
    });

    return NextResponse.json(transaksi);
  } catch (error) {
    console.error("GET riwayat kendaraan error:", error);
    return NextResponse.json({ error: "Gagal memuat riwayat servis kendaraan" }, { status: 500 });
  }
}
