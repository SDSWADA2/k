import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { nama, deskripsi, harga, estimasiJam, aktif } = body;
    const jasa = await prisma.jasaService.update({
      where: { id: params.id },
      data: { nama, deskripsi, harga: parseFloat(harga), estimasiJam: estimasiJam ? parseFloat(estimasiJam) : null, aktif },
    });
    return NextResponse.json(jasa);
  } catch {
    return NextResponse.json({ error: "Gagal mengupdate jasa service" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.jasaService.update({ where: { id: params.id }, data: { aktif: false } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus jasa service" }, { status: 500 });
  }
}
