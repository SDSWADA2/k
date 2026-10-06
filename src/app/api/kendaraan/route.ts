import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/kendaraan?pelangganId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pelangganId = searchParams.get("pelangganId");
  const search = searchParams.get("search") ?? "";

  try {
    const where: Record<string, unknown> = {};
    if (pelangganId) where.pelangganId = pelangganId;
    if (search) {
      where.OR = [
        { nomorPolisi: { contains: search } },
        { merek: { contains: search } },
        { model: { contains: search } },
      ];
    }

    const data = await prisma.kendaraan.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: { pelanggan: { select: { nama: true, telepon: true } } },
    });
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Gagal memuat kendaraan" }, { status: 500 });
  }
}

// POST /api/kendaraan
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { pelangganId, nomorPolisi, merek, model, tahun, warna, nomorRangka, nomorMesin, jenis, transmisi, catatan } = body;

    if (!pelangganId || !nomorPolisi || !merek || !model) {
      return NextResponse.json({ error: "Data kendaraan tidak lengkap" }, { status: 400 });
    }

    const kendaraan = await prisma.kendaraan.create({
      data: {
        pelangganId,
        nomorPolisi: nomorPolisi.toUpperCase(),
        merek,
        model,
        tahun: tahun ? parseInt(tahun) : null,
        warna,
        nomorRangka,
        nomorMesin,
        jenis: jenis ?? "MOTOR",
        transmisi,
        catatan,
      },
    });
    return NextResponse.json(kendaraan, { status: 201 });
  } catch (error: unknown) {
    if ((error as { code?: string }).code === "P2002") {
      return NextResponse.json({ error: "Nomor polisi sudah terdaftar" }, { status: 409 });
    }
    return NextResponse.json({ error: "Gagal menambah kendaraan" }, { status: 500 });
  }
}
