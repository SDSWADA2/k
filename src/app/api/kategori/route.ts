import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/kategori
export async function GET() {
  try {
    const data = await prisma.kategori.findMany({ orderBy: { nama: "asc" } });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Gagal memuat kategori" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { nama, deskripsi } = await req.json();
    if (!nama) return NextResponse.json({ error: "Nama wajib diisi" }, { status: 400 });
    const kat = await prisma.kategori.create({ data: { nama, deskripsi } });
    return NextResponse.json(kat, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Gagal membuat kategori" }, { status: 500 });
  }
}
