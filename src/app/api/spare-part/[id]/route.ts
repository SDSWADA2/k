import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/spare-part/[id]
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const part = await prisma.sparePart.findUnique({
      where: { id: params.id },
      include: { kategori: true },
    });
    if (!part) return NextResponse.json({ error: "Spare part tidak ditemukan" }, { status: 404 });
    return NextResponse.json(part);
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat data" }, { status: 500 });
  }
}

// PUT /api/spare-part/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { nama, kategoriId, satuan, hargaBeli, hargaJual, stok, stokMinimum, lokasi, aktif } = body;

    const part = await prisma.sparePart.update({
      where: { id: params.id },
      data: {
        nama,
        kategoriId: kategoriId || null,
        satuan,
        hargaBeli: parseFloat(hargaBeli),
        hargaJual: parseFloat(hargaJual),
        stok: parseInt(stok),
        stokMinimum: parseInt(stokMinimum),
        lokasi,
        aktif,
      },
    });

    return NextResponse.json(part);
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengupdate spare part" }, { status: 500 });
  }
}

// DELETE /api/spare-part/[id]
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.sparePart.update({
      where: { id: params.id },
      data: { aktif: false },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menghapus spare part" }, { status: 500 });
  }
}
