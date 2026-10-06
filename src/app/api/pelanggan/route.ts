import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/pelanggan
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const skip = (page - 1) * limit;

  try {
    const where = search
      ? {
          OR: [
            { nama: { contains: search } },
            { telepon: { contains: search } },
            { kode: { contains: search } },
          ],
        }
      : {};

    const [data, total] = await Promise.all([
      prisma.pelanggan.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { _count: { select: { kendaraan: true, transaksi: true } } },
      }),
      prisma.pelanggan.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("GET pelanggan error:", error);
    return NextResponse.json({ error: "Gagal memuat data pelanggan" }, { status: 500 });
  }
}

// POST /api/pelanggan
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, telepon, email, alamat, tipe } = body;

    if (!nama) {
      return NextResponse.json({ error: "Nama pelanggan wajib diisi" }, { status: 400 });
    }

    // Generate kode pelanggan
    const count = await prisma.pelanggan.count();
    const kode = `PLG-${String(count + 1).padStart(4, "0")}`;

    const pelanggan = await prisma.pelanggan.create({
      data: { kode, nama, telepon, email, alamat, tipe: tipe ?? "UMUM" },
    });

    return NextResponse.json(pelanggan, { status: 201 });
  } catch (error) {
    console.error("POST pelanggan error:", error);
    return NextResponse.json({ error: "Gagal menambah pelanggan" }, { status: 500 });
  }
}
