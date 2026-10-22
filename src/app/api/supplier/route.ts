import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/supplier
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const all = searchParams.get("all") === "true";

  try {
    const where: Record<string, unknown> = all ? {} : { aktif: true };
    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { telepon: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const suppliers = await prisma.supplier.findMany({
      where,
      orderBy: { nama: "asc" },
      include: {
        _count: { select: { pembelian: true } },
      },
    });

    return NextResponse.json(suppliers);
  } catch (error) {
    console.error("GET supplier error:", error);
    return NextResponse.json({ error: "Gagal memuat supplier" }, { status: 500 });
  }
}

// POST /api/supplier
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nama, telepon, email, alamat } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json({ error: "Nama supplier wajib diisi" }, { status: 400 });
    }

    const supplier = await prisma.supplier.create({
      data: {
        nama: nama.trim(),
        telepon: telepon?.trim() || null,
        email: email?.trim() || null,
        alamat: alamat?.trim() || null,
      },
    });

    return NextResponse.json(supplier, { status: 201 });
  } catch (error) {
    console.error("POST supplier error:", error);
    return NextResponse.json({ error: "Gagal membuat supplier" }, { status: 500 });
  }
}
