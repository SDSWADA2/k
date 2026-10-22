"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button } from "@/components/ui";
import { formatDateTime, formatRupiah } from "@/lib/utils";
import toast from "react-hot-toast";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface TransaksiDetail {
  id: string;
  nomorInvoice: string;
  tanggal: string;
  status: string;
  metodePembayaran?: string | null;
  subtotal: number;
  diskon: number;
  pajak: number;
  total: number;
  dibayar: number;
  kembalian: number;
  catatanKeluhan?: string | null;
  pelanggan?: { id: string; nama: string; telepon?: string | null; alamat?: string | null; tipe?: string } | null;
  kendaraan?: { id: string; nomorPolisi: string; merek: string; model: string; jenis: string } | null;
  kasir?: { nama: string } | null;
  detail: Array<{
    id: string;
    tipe: string;
    nama: string;
    jumlah: number;
    hargaSatuan: number;
    diskon: number;
    subtotal: number;
    mekanik?: { nama: string } | null;
  }>;
}

const STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "info" | "danger" | "default" }> = {
  LUNAS: { label: "Lunas", variant: "success" },
  SELESAI: { label: "Selesai", variant: "info" },
  PROSES: { label: "Dalam Proses", variant: "info" },
  ANTRI: { label: "Menunggu Antrian", variant: "warning" },
  BATAL: { label: "Dibatalkan", variant: "danger" },
};

export default function TransaksiDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [tx, setTx] = useState<TransaksiDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  const fetchDetail = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/transaksi/${id}`);
      if (!res.ok) throw new Error("Transaksi tidak ditemukan");
      setTx(await res.json());
    } catch {
      toast.error("Gagal memuat detail transaksi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchDetail();
  }, [id]);

  const handleUpdateStatus = async (status: string) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/transaksi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui status");
      toast.success(`Status berhasil diubah ke ${status}`);
      fetchDetail();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setUpdating(false);
    }
  };

  const handleCancel = async () => {
    if (!tx) return;
    if (!confirm(`Batalkan transaksi ${tx.nomorInvoice}? Stok spare part akan dikembalikan.`)) return;

    try {
      const res = await fetch(`/api/transaksi/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success("Transaksi berhasil dibatalkan dan stok telah dikembalikan");
      fetchDetail();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  const handleSendWA = () => {
    if (!tx || !tx.pelanggan?.telepon) {
      toast.error("Nomor WhatsApp pelanggan tidak ada");
      return;
    }

    let phone = tx.pelanggan.telepon.replace(/[^0-9]/g, "");
    if (phone.startsWith("0")) phone = "62" + phone.slice(1);

    const message = `Halo ${tx.pelanggan.nama}, invoice servis Anda *${tx.nomorInvoice}* di Bengkel kami berstatus *${tx.status}* dengan Total *${formatRupiah(tx.total)}*. Terima kasih!`;
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(message)}`, "_blank");
  };

  if (loading) {
    return (
      <AppShell title="Detail Transaksi">
        <div className="p-12 text-center text-slate-400">Memuat detail transaksi...</div>
      </AppShell>
    );
  }

  if (!tx) {
    return (
      <AppShell title="Detail Transaksi">
        <div className="p-12 text-center space-y-3">
          <p className="text-slate-500 font-semibold">Transaksi tidak ditemukan</p>
          <Link href="/transaksi" className="text-violet-600 hover:underline text-sm">
            ← Kembali ke Riwayat Transaksi
          </Link>
        </div>
      </AppShell>
    );
  }

  const s = STATUS_MAP[tx.status] ?? { label: tx.status, variant: "default" };

  return (
    <AppShell title={`Detail ${tx.nomorInvoice}`}>
      <div className="space-y-6 max-w-5xl mx-auto">
        {/* Header Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/transaksi"
              className="p-2 hover:bg-slate-200/60 rounded-xl text-slate-600 transition-colors"
              title="Kembali"
            >
              ←
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold text-slate-900">{tx.nomorInvoice}</h1>
                <Badge variant={s.variant}>{s.label}</Badge>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Dibuat pada {formatDateTime(tx.tanggal)}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {tx.pelanggan?.telepon && (
              <button
                onClick={handleSendWA}
                className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
              >
                📲 WhatsApp
              </button>
            )}

            <a
              href={`/transaksi/${tx.id}/invoice`}
              target="_blank"
              className="px-4 py-2 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-sm transition-colors flex items-center gap-1.5"
            >
              🖨️ Cetak Invoice
            </a>

            {/* Status Change Dropdown */}
            {tx.status !== "BATAL" && tx.status !== "LUNAS" && (
              <div className="flex items-center gap-1">
                {tx.status === "ANTRI" && (
                  <Button size="sm" loading={updating} onClick={() => handleUpdateStatus("PROSES")}>
                    Mulai Kerjakan (Proses)
                  </Button>
                )}
                {tx.status === "PROSES" && (
                  <Button size="sm" loading={updating} onClick={() => handleUpdateStatus("SELESAI")}>
                    Tandai Selesai
                  </Button>
                )}
                {tx.status === "SELESAI" && (
                  <Button size="sm" loading={updating} onClick={() => handleUpdateStatus("LUNAS")}>
                    Tandai Lunas
                  </Button>
                )}
              </div>
            )}

            {tx.status !== "BATAL" && tx.status !== "LUNAS" && (
              <button
                onClick={handleCancel}
                className="px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors border border-red-200"
              >
                Batalkan
              </button>
            )}
          </div>
        </div>

        {/* Info Grid (Customer, Vehicle, Staff) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Customer */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1.5 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Data Pelanggan</p>
            <p className="font-bold text-slate-900 text-sm">{tx.pelanggan?.nama ?? "Pelanggan Umum"}</p>
            {tx.pelanggan?.telepon && <p className="text-xs text-slate-500">📞 {tx.pelanggan.telepon}</p>}
            {tx.pelanggan?.alamat && <p className="text-xs text-slate-400">📍 {tx.pelanggan.alamat}</p>}
          </div>

          {/* Vehicle */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1.5 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Kendaraan</p>
            {tx.kendaraan ? (
              <>
                <p className="font-mono font-bold text-slate-900 text-sm bg-slate-100 px-2 py-0.5 rounded inline-block">
                  {tx.kendaraan.nomorPolisi}
                </p>
                <p className="text-xs text-slate-600 font-medium">
                  {tx.kendaraan.merek} {tx.kendaraan.model} ({tx.kendaraan.jenis})
                </p>
              </>
            ) : (
              <p className="text-xs text-slate-400">Tanpa kendaraan (penjualan langsung)</p>
            )}
          </div>

          {/* Staff */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-1.5 shadow-sm">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Petugas Bengkel</p>
            <p className="text-xs text-slate-600">
              Kasir: <strong className="text-slate-800">{tx.kasir?.nama ?? "Admin"}</strong>
            </p>
            <p className="text-xs text-slate-600">
              Metode: <strong className="text-slate-800">{tx.metodePembayaran ?? "Tunai"}</strong>
            </p>
          </div>
        </div>

        {/* Complaints notes */}
        {tx.catatanKeluhan && (
          <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900">
            <span className="font-bold">Keluhan / Permintaan Pelanggan:</span> &quot;{tx.catatanKeluhan}&quot;
          </div>
        )}

        {/* Items Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800">Rincian Spare Part &amp; Jasa</h2>
            <span className="text-xs text-slate-400">{tx.detail.length} item</span>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tipe</th>
                  <th>Nama Item / Pekerjaan</th>
                  <th>Mekanik</th>
                  <th className="text-right">Harga Satuan</th>
                  <th className="text-center">Qty</th>
                  <th className="text-right">Diskon</th>
                  <th className="text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {tx.detail.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <Badge variant={d.tipe === "SPARE_PART" ? "info" : "secondary"}>
                        {d.tipe === "SPARE_PART" ? "Spare Part" : "Jasa"}
                      </Badge>
                    </td>
                    <td className="font-semibold text-slate-900">{d.nama}</td>
                    <td className="text-xs text-slate-600">{d.mekanik?.nama ?? "-"}</td>
                    <td className="text-right text-slate-600">{formatRupiah(d.hargaSatuan)}</td>
                    <td className="text-center font-bold">{d.jumlah}</td>
                    <td className="text-right text-xs text-red-500">{d.diskon > 0 ? `${d.diskon}%` : "-"}</td>
                    <td className="text-right font-bold text-slate-900">{formatRupiah(d.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="p-5 border-t border-slate-200 bg-slate-50/50 flex flex-col items-end space-y-1.5 text-xs">
            <div className="w-64 flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>{formatRupiah(tx.subtotal)}</span>
            </div>
            {tx.diskon > 0 && (
              <div className="w-64 flex justify-between text-red-600">
                <span>Diskon ({tx.diskon}%):</span>
                <span>-{formatRupiah((tx.subtotal * tx.diskon) / 100)}</span>
              </div>
            )}
            {tx.pajak > 0 && (
              <div className="w-64 flex justify-between text-slate-600">
                <span>Pajak ({tx.pajak}%):</span>
                <span>+{formatRupiah((tx.subtotal * tx.pajak) / 100)}</span>
              </div>
            )}
            <div className="w-64 flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-300">
              <span>Total:</span>
              <span className="text-violet-700">{formatRupiah(tx.total)}</span>
            </div>
            {tx.metodePembayaran && (
              <>
                <div className="w-64 flex justify-between text-slate-600 pt-1">
                  <span>Dibayar:</span>
                  <span>{formatRupiah(tx.dibayar)}</span>
                </div>
                {tx.kembalian > 0 && (
                  <div className="w-64 flex justify-between font-bold text-emerald-700">
                    <span>Kembalian:</span>
                    <span>{formatRupiah(tx.kembalian)}</span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
