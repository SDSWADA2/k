import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/mekanik
export async function GET() {
  try {
    const data = await prisma.mekanik.findMany({
      where: { aktif: true },
      orderBy: { nama: "asc" },
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Gagal memuat mekanik" }, { status: 500 });
  }
}

// POST /api/mekanik
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, telepon, spesialisasi } = body;
    if (!nama) return NextResponse.json({ error: "Nama mekanik wajib diisi" }, { status: 400 });

    const count = await prisma.mekanik.count();
    const kode = `MKN-${String(count + 1).padStart(3, "0")}`;

    const mekanik = await prisma.mekanik.create({
      data: { kode, nama, telepon, spesialisasi },
    });
    return NextResponse.json(mekanik, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal menambah mekanik" }, { status: 500 });
  }
}
