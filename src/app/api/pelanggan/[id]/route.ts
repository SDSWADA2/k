import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/pelanggan/[id]
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pelanggan = await prisma.pelanggan.findUnique({
      where: { id: params.id },
      include: {
        kendaraan: { orderBy: { createdAt: "desc" } },
        transaksi: {
          take: 10,
          orderBy: { tanggal: "desc" },
          select: { id: true, nomorInvoice: true, total: true, status: true, tanggal: true },
        },
      },
    });

    if (!pelanggan) {
      return NextResponse.json({ error: "Pelanggan tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(pelanggan);
  } catch (error) {
    console.error("GET pelanggan by id error:", error);
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}

// PUT /api/pelanggan/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { nama, telepon, email, alamat, tipe, aktif } = body;

    const pelanggan = await prisma.pelanggan.update({
      where: { id: params.id },
      data: { nama, telepon, email, alamat, tipe, aktif },
    });

    return NextResponse.json(pelanggan);
  } catch (error) {
    console.error("PUT pelanggan error:", error);
    return NextResponse.json({ error: "Gagal mengupdate pelanggan" }, { status: 500 });
  }
}

// DELETE /api/pelanggan/[id]
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.pelanggan.update({
      where: { id: params.id },
      data: { aktif: false },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE pelanggan error:", error);
    return NextResponse.json({ error: "Gagal menghapus pelanggan" }, { status: 500 });
  }
}
