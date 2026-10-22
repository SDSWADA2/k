import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { InvoiceClient } from "./InvoiceClient";
import type { Metadata } from "next";

export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const tx = await prisma.transaksi.findUnique({
    where: { id: params.id },
    select: { nomorInvoice: true },
  });
  return {
    title: tx ? `Invoice ${tx.nomorInvoice}` : "Invoice",
  };
}

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const tx = await prisma.transaksi.findUnique({
    where: { id: params.id },
    include: {
      pelanggan: true,
      kendaraan: true,
      kasir: { select: { nama: true } },
      detail: {
        include: {
          sparePart: { select: { kode: true, satuan: true } },
          jasaService: { select: { kode: true } },
          mekanik: { select: { nama: true } },
        },
      },
    },
  });

  if (!tx) notFound();

  const settings = await prisma.pengaturan.findMany();
  const cfg = Object.fromEntries(settings.map((s) => [s.kunci, s.nilai]));

  const serializedTx = {
    ...tx,
    tanggal: tx.tanggal.toISOString(),
  };

  return <InvoiceClient tx={serializedTx} cfg={cfg} />;
}
