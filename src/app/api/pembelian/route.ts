import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/pembelian
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") ?? "";
  const status = searchParams.get("status") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "20");
  const skip = (page - 1) * limit;

  try {
    const where: Record<string, unknown> = {};
    if (search) {
      where.OR = [
        { nomorPO: { contains: search } },
        { supplier: { nama: { contains: search } } },
        { catatan: { contains: search } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [data, total] = await Promise.all([
      prisma.pembelian.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          supplier: { select: { id: true, nama: true, telepon: true } },
          detail: {
            include: {
              sparePart: { select: { id: true, kode: true, nama: true, satuan: true } },
            },
          },
        },
      }),
      prisma.pembelian.count({ where }),
    ]);

    return NextResponse.json({ data, total, page, limit });
  } catch (error) {
    console.error("GET pembelian error:", error);
    return NextResponse.json({ error: "Gagal memuat pembelian" }, { status: 500 });
  }
}

// POST /api/pembelian — buat PO baru
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { supplierId, catatan, items, status = "SELESAI" } = body;
    // items: Array<{ sparePartId: string; jumlah: number; hargaBeli: number }>

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Daftar item pembelian tidak boleh kosong" }, { status: 400 });
    }

    // Generate PO number
    const count = await prisma.pembelian.count();
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const nomorPO = `PO-${y}${m}${d}-${String(count + 1).padStart(4, "0")}`;

    const total = items.reduce((sum, item) => sum + (item.jumlah * item.hargaBeli), 0);

    const pembelian = await prisma.$transaction(async (tx) => {
      const p = await tx.pembelian.create({
        data: {
          nomorPO,
          supplierId: supplierId || null,
          status,
          total,
          catatan: catatan || null,
          detail: {
            create: items.map((i) => ({
              sparePartId: i.sparePartId,
              jumlah: Number(i.jumlah),
              hargaBeli: Number(i.hargaBeli),
              subtotal: Number(i.jumlah) * Number(i.hargaBeli),
            })),
          },
        },
        include: { detail: true },
      });

      // Jika status SELESAI, langsung update stok dan harga beli terbaru
      if (status === "SELESAI") {
        for (const item of items) {
          await tx.sparePart.update({
            where: { id: item.sparePartId },
            data: {
              stok: { increment: Number(item.jumlah) },
              hargaBeli: Number(item.hargaBeli),
            },
          });
        }
      }

      return p;
    });

    return NextResponse.json(pembelian, { status: 201 });
  } catch (error) {
    console.error("POST pembelian error:", error);
    return NextResponse.json({ error: "Gagal membuat pembelian" }, { status: 500 });
  }
}
