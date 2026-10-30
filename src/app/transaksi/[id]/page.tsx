"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Button, Modal, Input } from "@/components/ui";
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

  // Payment Settlement Modal
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [metodePembayaran, setMetodePembayaran] = useState("TUNAI");
  const [dibayarInput, setDibayarInput] = useState("");
  const [processingPay, setProcessingPay] = useState(false);

  const handleOpenPayModal = () => {
    if (!tx) return;
    setDibayarInput(String(tx.total));
    setMetodePembayaran(tx.metodePembayaran || "TUNAI");
    setPayModalOpen(true);
  };

  const handleProcessPayment = async () => {
    if (!tx) return;
    const amount = parseFloat(dibayarInput.replace(/[^0-9.]/g, "")) || 0;
    if (metodePembayaran === "TUNAI" && amount < tx.total) {
      toast.error("Jumlah bayar kurang dari total tagihan!");
      return;
    }

    setProcessingPay(true);
    try {
      const res = await fetch(`/api/transaksi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "LUNAS",
          metodePembayaran,
          dibayar: amount,
        }),
      });
      if (!res.ok) throw new Error("Gagal memproses pembayaran");
      toast.success("✅ Pembayaran berhasil dicatat & Lunas!");
      setPayModalOpen(false);
      fetchDetail();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setProcessingPay(false);
    }
  };

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
              <div className="flex items-center gap-1.5 flex-wrap">
                {tx.status === "ANTRI" && (
                  <Button size="sm" variant="outline" loading={updating} onClick={() => handleUpdateStatus("PROSES")}>
                    Mulai Kerjakan (Proses)
                  </Button>
                )}
                {tx.status === "PROSES" && (
                  <Button size="sm" variant="outline" loading={updating} onClick={() => handleUpdateStatus("SELESAI")}>
                    Tandai Selesai
                  </Button>
                )}
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-sm"
                  onClick={handleOpenPayModal}
                >
                  💳 Bayar / Lunasi ({formatRupiah(tx.total)})
                </Button>
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

        {/* Modal Pelunasan Pembayaran */}
        <Modal
          isOpen={payModalOpen}
          onClose={() => setPayModalOpen(false)}
          title={`Pelunasan Transaksi ${tx.nomorInvoice}`}
          size="md"
        >
          <div className="p-5 space-y-4">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex justify-between items-center">
              <div>
                <p className="text-xs text-slate-500 font-medium">Total Tagihan:</p>
                <p className="text-xl font-black text-violet-700">{formatRupiah(tx.total)}</p>
              </div>
              <div className="text-right text-xs text-slate-500">
                <p className="font-semibold text-slate-800">{tx.pelanggan?.nama ?? "Pelanggan Umum"}</p>
                <p className="font-mono text-[11px]">{tx.kendaraan?.nomorPolisi ?? "Tanpa Kendaraan"}</p>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Metode Pembayaran</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "TUNAI", label: "💵 Tunai" },
                  { id: "QRIS", label: "📱 QRIS" },
                  { id: "TRANSFER", label: "🏦 Transfer" },
                  { id: "DEBIT", label: "💳 Debit" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setMetodePembayaran(m.id);
                      if (m.id !== "TUNAI") setDibayarInput(String(tx.total));
                    }}
                    className={`py-2 px-2 text-xs font-bold rounded-lg border transition-all text-center ${
                      metodePembayaran === m.id
                        ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-xs font-semibold text-slate-700">Nominal Uang Diterima (Rp)</label>
                <button
                  type="button"
                  onClick={() => setDibayarInput(String(tx.total))}
                  className="text-[11px] font-bold text-violet-600 hover:underline"
                >
                  Uang Pas
                </button>
              </div>
              <Input
                type="text"
                value={dibayarInput}
                onChange={(e) => setDibayarInput(e.target.value)}
                placeholder="0"
                autoFocus
              />

              {/* Pecahan Uang Cepat */}
              <div className="flex gap-1.5 mt-2 flex-wrap">
                {[
                  { val: tx.total, label: "Uang Pas" },
                  { val: 50000, label: "50rb" },
                  { val: 100000, label: "100rb" },
                  { val: 150000, label: "150rb" },
                  { val: 200000, label: "200rb" },
                  { val: 500000, label: "500rb" },
                ].map((btn, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setDibayarInput(String(btn.val))}
                    className="px-2.5 py-1 text-[11px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors"
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kembalian / Kurang Information */}
            {(() => {
              const amount = parseFloat(dibayarInput.replace(/[^0-9.]/g, "")) || 0;
              const kembalian = Math.max(0, amount - tx.total);
              const kurang = Math.max(0, tx.total - amount);

              return (
                <div
                  className={`p-3 rounded-xl border text-xs font-semibold flex justify-between items-center ${
                    kurang > 0 && metodePembayaran === "TUNAI"
                      ? "bg-red-50 border-red-200 text-red-700"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  <span>
                    {kurang > 0 && metodePembayaran === "TUNAI" ? "Sisa Kurang Bayar:" : "Kembalian Kasir:"}
                  </span>
                  <span className="text-sm font-black">
                    {kurang > 0 && metodePembayaran === "TUNAI"
                      ? formatRupiah(kurang)
                      : formatRupiah(kembalian)}
                  </span>
                </div>
              );
            })()}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" onClick={() => setPayModalOpen(false)}>
                Batal
              </Button>
              <Button
                type="button"
                loading={processingPay}
                onClick={handleProcessPayment}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                Konfirmasi Lunas
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </AppShell>
  );
}
