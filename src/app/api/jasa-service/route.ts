import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/jasa-service
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";

  try {
    const where = search
      ? { OR: [{ nama: { contains: search } }, { kode: { contains: search } }], aktif: true }
      : { aktif: true };

    const data = await prisma.jasaService.findMany({
      where,
      orderBy: { nama: "asc" },
    });

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Gagal memuat jasa service" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, deskripsi, harga, estimasiJam } = body;
    if (!nama || !harga) return NextResponse.json({ error: "Nama dan harga wajib diisi" }, { status: 400 });

    const count = await prisma.jasaService.count();
    const kode = `JSR-${String(count + 1).padStart(3, "0")}`;

    const jasa = await prisma.jasaService.create({
      data: { kode, nama, deskripsi, harga: parseFloat(harga), estimasiJam: estimasiJam ? parseFloat(estimasiJam) : null },
    });

    return NextResponse.json(jasa, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: "Gagal menambah jasa service" }, { status: 500 });
  }
}
