import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/spare-part
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const kategoriId = searchParams.get("kategoriId") ?? "";
  const stokKritis = searchParams.get("stokKritis") === "true";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const skip = (page - 1) * limit;

  try {
    const where: Record<string, unknown> = { aktif: true };

    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { kode: { contains: search } },
      ];
    }
    if (kategoriId) where.kategoriId = kategoriId;
    if (stokKritis) {
      const critical = await prisma.$queryRaw<Array<{ id: string }>>`
        SELECT id FROM spare_part WHERE stok <= stokMinimum AND aktif = 1
      `;
      where.id = { in: critical.map((c) => c.id) };
    }

    const [data, total] = await Promise.all([
      prisma.sparePart.findMany({
        where,
        skip,
        take: limit,
        orderBy: { nama: "asc" },
        include: { kategori: { select: { id: true, nama: true } } },
      }),
      prisma.sparePart.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("GET spare-part error:", error);
    return NextResponse.json({ error: "Gagal memuat spare part" }, { status: 500 });
  }
}

// POST /api/spare-part
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, kategoriId, satuan, hargaBeli, hargaJual, stok, stokMinimum, lokasi } = body;

    if (!nama) return NextResponse.json({ error: "Nama spare part wajib diisi" }, { status: 400 });

    const count = await prisma.sparePart.count();
    const kode = `SP-${String(count + 1).padStart(4, "0")}`;

    const part = await prisma.sparePart.create({
      data: {
        kode,
        nama,
        kategoriId: kategoriId || null,
        satuan: satuan ?? "pcs",
        hargaBeli: parseFloat(hargaBeli) || 0,
        hargaJual: parseFloat(hargaJual) || 0,
        stok: parseInt(stok) || 0,
        stokMinimum: parseInt(stokMinimum) || 5,
        lokasi,
      },
    });

    return NextResponse.json(part, { status: 201 });
  } catch (error) {
    console.error("POST spare-part error:", error);
    return NextResponse.json({ error: "Gagal menambah spare part" }, { status: 500 });
  }
}
