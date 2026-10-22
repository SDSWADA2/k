import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/kendaraan/[id]
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const kendaraan = await prisma.kendaraan.findUnique({
      where: { id: params.id },
      include: { pelanggan: true },
    });
    if (!kendaraan) return NextResponse.json({ error: "Kendaraan tidak ditemukan" }, { status: 404 });
    return NextResponse.json(kendaraan);
  } catch {
    return NextResponse.json({ error: "Gagal memuat kendaraan" }, { status: 500 });
  }
}

// PUT /api/kendaraan/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { nomorPolisi, merek, model, tahun, warna, nomorRangka, nomorMesin, jenis, transmisi, catatan, pelangganId } = body;

    const updated = await prisma.kendaraan.update({
      where: { id: params.id },
      data: {
        ...(nomorPolisi && { nomorPolisi: nomorPolisi.toUpperCase() }),
        ...(merek && { merek }),
        ...(model && { model }),
        tahun: tahun ? parseInt(tahun) : null,
        warna: warna ?? null,
        nomorRangka: nomorRangka ?? null,
        nomorMesin: nomorMesin ?? null,
        ...(jenis && { jenis }),
        transmisi: transmisi ?? null,
        catatan: catatan ?? null,
        ...(pelangganId && { pelangganId }),
      },
    });

    return NextResponse.json(updated);
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Nomor polisi sudah digunakan kendaraan lain" }, { status: 409 });
    }
    return NextResponse.json({ error: "Gagal memperbarui kendaraan" }, { status: 500 });
  }
}

// DELETE /api/kendaraan/[id]
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Check if vehicle has associated transactions
    const txCount = await prisma.transaksi.count({
      where: { kendaraanId: params.id },
    });

    if (txCount > 0) {
      return NextResponse.json(
        { error: `Tidak dapat menghapus kendaraan karena memiliki ${txCount} riwayat transaksi.` },
        { status: 400 }
      );
    }

    await prisma.kendaraan.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus kendaraan" }, { status: 500 });
  }
}
