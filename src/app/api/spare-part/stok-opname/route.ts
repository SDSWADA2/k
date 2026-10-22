import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// POST /api/spare-part/stok-opname
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sparePartId, stokBaru, catatan } = body;

    if (!sparePartId) {
      return NextResponse.json({ error: "Spare part harus dipilih" }, { status: 400 });
    }

    const stokNum = parseInt(String(stokBaru));
    if (isNaN(stokNum) || stokNum < 0) {
      return NextResponse.json({ error: "Jumlah stok baru tidak valid" }, { status: 400 });
    }

    const sp = await prisma.sparePart.findUnique({ where: { id: sparePartId } });
    if (!sp) {
      return NextResponse.json({ error: "Spare part tidak ditemukan" }, { status: 404 });
    }

    const diff = stokNum - sp.stok;

    const updated = await prisma.sparePart.update({
      where: { id: sparePartId },
      data: {
        stok: stokNum,
      },
    });

    return NextResponse.json({
      success: true,
      sparePart: updated,
      stokLama: sp.stok,
      stokBaru: stokNum,
      selisih: diff,
      catatan: catatan || "Penyesuaian stok opname",
    });
  } catch (error) {
    console.error("Stok opname error:", error);
    return NextResponse.json({ error: "Gagal menyesuaikan stok" }, { status: 500 });
  }
}
