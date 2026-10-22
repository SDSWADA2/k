import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/pembelian/[id]
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const pembelian = await prisma.pembelian.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        detail: {
          include: {
            sparePart: true,
          },
        },
      },
    });

    if (!pembelian) {
      return NextResponse.json({ error: "Pembelian tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(pembelian);
  } catch (error) {
    console.error("GET pembelian by id error:", error);
    return NextResponse.json({ error: "Gagal memuat pembelian" }, { status: 500 });
  }
}

// PATCH /api/pembelian/[id] — update status (e.g. from PENDING to SELESAI)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { status, catatan } = body;

    const existing = await prisma.pembelian.findUnique({
      where: { id: params.id },
      include: { detail: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Pembelian tidak ditemukan" }, { status: 404 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Jika status berubah dari PENDING ke SELESAI, tambah stok
      if (existing.status !== "SELESAI" && status === "SELESAI") {
        for (const d of existing.detail) {
          await tx.sparePart.update({
            where: { id: d.sparePartId },
            data: {
              stok: { increment: d.jumlah },
              hargaBeli: d.hargaBeli,
            },
          });
        }
      }

      // Jika sebelumnya SELESAI lalu diubah jadi BATAL, kurangi stok kembali
      if (existing.status === "SELESAI" && status === "BATAL") {
        for (const d of existing.detail) {
          await tx.sparePart.update({
            where: { id: d.sparePartId },
            data: {
              stok: { decrement: d.jumlah },
            },
          });
        }
      }

      return tx.pembelian.update({
        where: { id: params.id },
        data: {
          status: status || existing.status,
          catatan: catatan !== undefined ? catatan : existing.catatan,
        },
        include: {
          supplier: true,
          detail: { include: { sparePart: true } },
        },
      });
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("PATCH pembelian error:", error);
    return NextResponse.json({ error: "Gagal memperbarui pembelian" }, { status: 500 });
  }
}

// DELETE /api/pembelian/[id] — batalkan pembelian
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existing = await prisma.pembelian.findUnique({
      where: { id: params.id },
      include: { detail: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Pembelian tidak ditemukan" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      // Jika statusnya SELESAI, kembalikan stok
      if (existing.status === "SELESAI") {
        for (const d of existing.detail) {
          await tx.sparePart.update({
            where: { id: d.sparePartId },
            data: { stok: { decrement: d.jumlah } },
          });
        }
      }

      await tx.pembelian.update({
        where: { id: params.id },
        data: { status: "BATAL" },
      });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE pembelian error:", error);
    return NextResponse.json({ error: "Gagal membatalkan pembelian" }, { status: 500 });
  }
}
