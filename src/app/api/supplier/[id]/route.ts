import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// PUT /api/supplier/[id]
export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const { nama, telepon, email, alamat, aktif } = body;

    const supplier = await prisma.supplier.update({
      where: { id: params.id },
      data: {
        nama: nama?.trim(),
        telepon: telepon?.trim() || null,
        email: email?.trim() || null,
        alamat: alamat?.trim() || null,
        aktif: aktif !== undefined ? Boolean(aktif) : undefined,
      },
    });

    return NextResponse.json(supplier);
  } catch (error) {
    console.error("PUT supplier error:", error);
    return NextResponse.json({ error: "Gagal memperbarui supplier" }, { status: 500 });
  }
}

// DELETE /api/supplier/[id]
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Soft delete
    await prisma.supplier.update({
      where: { id: params.id },
      data: { aktif: false },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE supplier error:", error);
    return NextResponse.json({ error: "Gagal menghapus supplier" }, { status: 500 });
  }
}
