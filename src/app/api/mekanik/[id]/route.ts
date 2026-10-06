import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { nama, telepon, spesialisasi, aktif } = await req.json();
    const mekanik = await prisma.mekanik.update({
      where: { id: params.id },
      data: { nama, telepon, spesialisasi, aktif },
    });
    return NextResponse.json(mekanik);
  } catch {
    return NextResponse.json({ error: "Gagal mengupdate mekanik" }, { status: 500 });
  }
}

export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    await prisma.mekanik.update({ where: { id: params.id }, data: { aktif: false } });
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Gagal menghapus mekanik" }, { status: 500 });
  }
}
