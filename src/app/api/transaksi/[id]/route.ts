import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// GET /api/transaksi/[id]
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const transaksi = await prisma.transaksi.findUnique({
      where: { id: params.id },
      include: {
        pelanggan: true,
        kendaraan: true,
        kasir: { select: { nama: true } },
        detail: {
          include: {
            sparePart: { select: { kode: true, nama: true, satuan: true } },
            jasaService: { select: { kode: true, nama: true } },
            mekanik: { select: { nama: true } },
          },
        },
      },
    });

    if (!transaksi) {
      return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json(transaksi);
  } catch (error) {
    console.error("GET transaksi by id error:", error);
    return NextResponse.json({ error: "Gagal memuat transaksi" }, { status: 500 });
  }
}

// PATCH /api/transaksi/[id] — update status or pembayaran
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { status, metodePembayaran, dibayar } = body;

    const existing = await prisma.transaksi.findUnique({ where: { id: params.id } });
    if (!existing) return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });

    const updateData: Record<string, unknown> = {};
    if (status) updateData.status = status;
    if (metodePembayaran) updateData.metodePembayaran = metodePembayaran;
    if (dibayar !== undefined) {
      updateData.dibayar = dibayar;
      updateData.kembalian = Math.max(0, dibayar - existing.total);
      if (dibayar >= existing.total) updateData.status = "LUNAS";
    }

    const transaksi = await prisma.transaksi.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json(transaksi);
  } catch (error) {
    console.error("PATCH transaksi error:", error);
    return NextResponse.json({ error: "Gagal mengupdate transaksi" }, { status: 500 });
  }
}

// DELETE /api/transaksi/[id] — cancel transaction
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const transaksi = await prisma.transaksi.findUnique({
      where: { id: params.id },
      include: { detail: true },
    });
    if (!transaksi) return NextResponse.json({ error: "Transaksi tidak ditemukan" }, { status: 404 });
    if (transaksi.status === "LUNAS") {
      return NextResponse.json({ error: "Transaksi yang sudah lunas tidak dapat dibatalkan" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      // Kembalikan stok
      for (const d of transaksi.detail) {
        if (d.tipe === "SPARE_PART" && d.sparePartId) {
          await tx.sparePart.update({
            where: { id: d.sparePartId },
            data: { stok: { increment: d.jumlah } },
          });
        }
      }
      await tx.transaksi.update({ where: { id: params.id }, data: { status: "BATAL" } });
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE transaksi error:", error);
    return NextResponse.json({ error: "Gagal membatalkan transaksi" }, { status: 500 });
  }
}
