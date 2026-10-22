"use client";

import React, { useState, useEffect } from "react";
import { formatDateTime, formatRupiah } from "@/lib/utils";
import toast from "react-hot-toast";

interface InvoiceData {
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
  pelanggan?: { nama: string; telepon?: string | null; alamat?: string | null } | null;
  kendaraan?: { nomorPolisi: string; merek: string; model: string; jenis: string } | null;
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

interface SettingsConfig {
  nama_bengkel?: string;
  alamat_bengkel?: string;
  telepon_bengkel?: string;
  footer_invoice?: string;
}

export function InvoiceClient({
  tx,
  cfg,
}: {
  tx: InvoiceData;
  cfg: SettingsConfig;
}) {
  const [paperWidth, setPaperWidth] = useState<"80mm" | "58mm">("80mm");

  const diskonNominal = (tx.subtotal * (tx.diskon || 0)) / 100;
  const pajakNominal = ((tx.subtotal - diskonNominal) * (tx.pajak || 0)) / 100;

  const handlePrint = () => {
    window.print();
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Tautan invoice disalin!");
    }
  };

  const handleShareWhatsApp = () => {
    if (!tx.pelanggan?.telepon) {
      toast.error("Nomor telepon pelanggan tidak tersedia");
      return;
    }

    let phone = tx.pelanggan.telepon.replace(/[^0-9]/g, "");
    if (phone.startsWith("0")) {
      phone = "62" + phone.slice(1);
    }

    const itemsSummary = tx.detail.map((d) => `• ${d.nama} (${d.jumlah}x) - ${formatRupiah(d.subtotal)}`).join("%0A");

    const message = `Halo ${tx.pelanggan.nama}, terima kasih telah mempercayakan kendaraan Anda di *${cfg.nama_bengkel ?? "Bengkel Motor"}*.%0A%0A*RINCIAN INVOICE: ${tx.nomorInvoice}*%0A` +
      `Kendaraan: ${tx.kendaraan ? `${tx.kendaraan.nomorPolisi} (${tx.kendaraan.merek} ${tx.kendaraan.model})` : "-" }%0A` +
      `Tanggal: ${formatDateTime(tx.tanggal)}%0A%0A` +
      `*Daftar Pekerjaan & Part:*%0A${itemsSummary}%0A%0A` +
      `*Total: ${formatRupiah(tx.total)}*%0A` +
      `Status: *${tx.status}*%0A%0A` +
      `${cfg.footer_invoice ?? "Garansi servis 7 hari. Semoga kendaraannya semakin prima!"}`;

    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-2 sm:px-4 font-sans text-slate-900 print:bg-white print:py-0 print:px-0">
      {/* Top Floating Control Bar (Hidden when printing) */}
      <div className="no-print max-w-xl mx-auto mb-6 bg-white rounded-2xl shadow-lg border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.history.back()}
            className="p-2 hover:bg-slate-100 rounded-xl text-slate-500 hover:text-slate-800 transition-colors"
            title="Kembali"
          >
            ← Kembali
          </button>
          <div>
            <h1 className="text-sm font-bold text-slate-800">Invoice #{tx.nomorInvoice}</h1>
            <p className="text-xs text-slate-400">Siap dicetak ke printer kasir thermal</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-slate-100 p-0.5 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setPaperWidth("80mm")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                paperWidth === "80mm" ? "bg-white text-violet-700 shadow-sm" : "text-slate-600"
              }`}
            >
              80mm
            </button>
            <button
              onClick={() => setPaperWidth("58mm")}
              className={`px-2.5 py-1 rounded-md transition-all ${
                paperWidth === "58mm" ? "bg-white text-violet-700 shadow-sm" : "text-slate-600"
              }`}
            >
              58mm
            </button>
          </div>

          {tx.pelanggan?.telepon && (
            <button
              onClick={handleShareWhatsApp}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-sm transition-colors"
              title="Kirim Nota ke WhatsApp"
            >
              📲 WA Pelanggan
            </button>
          )}

          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
          >
            🔗 Salin Link
          </button>

          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-xl shadow-sm transition-colors"
          >
            🖨️ Cetak Struk
          </button>
        </div>
      </div>

      {/* Printable Receipt Paper Container */}
      <div
        className={`mx-auto bg-white p-6 shadow-2xl rounded-2xl border border-slate-200 print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none`}
        style={{
          maxWidth: paperWidth === "80mm" ? "380px" : "300px",
          fontFamily: "'Courier New', Courier, monospace",
          fontSize: paperWidth === "80mm" ? "12px" : "11px",
          lineHeight: "1.35",
        }}
      >
        {/* Receipt Header */}
        <div className="text-center pb-2">
          <div className="font-bold text-base tracking-tight">{cfg.nama_bengkel ?? "Bengkel Motor Maju"}</div>
          <div className="text-xs text-slate-600 mt-0.5">{cfg.alamat_bengkel ?? "Jl. Bengkel No. 1"}</div>
          {cfg.telepon_bengkel && (
            <div className="text-xs text-slate-600">Telp/WA: {cfg.telepon_bengkel}</div>
          )}
        </div>

        <div className="border-t border-dashed border-slate-400 my-2" />

        {/* Invoice Info */}
        <div className="text-center font-bold text-xs uppercase tracking-wider">
          NOTA SERVIS &amp; PENJUALAN
        </div>
        <div className="text-center text-xs font-mono font-semibold text-slate-700">
          {tx.nomorInvoice}
        </div>
        <div className="text-center text-[10px] text-slate-500 mt-0.5">
          {formatDateTime(tx.tanggal)}
        </div>

        <div className="border-t border-dashed border-slate-400 my-2" />

        {/* Customer & Vehicle Info */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-500">Pelanggan:</span>
            <span className="font-bold text-slate-900">{tx.pelanggan?.nama ?? "Pelanggan Umum"}</span>
          </div>
          {tx.pelanggan?.telepon && (
            <div className="flex justify-between">
              <span className="text-slate-500">No. HP:</span>
              <span>{tx.pelanggan.telepon}</span>
            </div>
          )}
          {tx.kendaraan && (
            <>
              <div className="flex justify-between">
                <span className="text-slate-500">No. Polisi:</span>
                <span className="font-bold bg-slate-100 px-1 rounded">{tx.kendaraan.nomorPolisi}</span>
              </div>
              <div className="flex justify-between text-[11px] text-slate-600">
                <span>Unit:</span>
                <span>{tx.kendaraan.merek} {tx.kendaraan.model}</span>
              </div>
            </>
          )}
          {tx.kasir && (
            <div className="flex justify-between text-[11px] text-slate-500">
              <span>Kasir:</span>
              <span>{tx.kasir.nama}</span>
            </div>
          )}
        </div>

        {tx.catatanKeluhan && (
          <div className="mt-2 p-1.5 bg-slate-50 rounded border border-slate-200 text-[11px] italic text-slate-600">
            Keluhan: &quot;{tx.catatanKeluhan}&quot;
          </div>
        )}

        <div className="border-t border-dashed border-slate-400 my-2" />

        {/* Items Table */}
        <div className="space-y-2">
          <div className="flex justify-between font-bold text-xs border-b border-slate-300 pb-1">
            <span>Item &amp; Deskripsi</span>
            <span className="text-right">Total</span>
          </div>

          {tx.detail.map((item) => (
            <div key={item.id} className="text-xs">
              <div className="flex justify-between font-medium">
                <span className="flex-1 pr-2 break-words">
                  {item.tipe === "SPARE_PART" ? "🔩 " : "🔧 "}
                  {item.nama}
                </span>
                <span className="font-semibold">{formatRupiah(item.subtotal)}</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-500 pl-4">
                <span>{item.jumlah} × {formatRupiah(item.hargaSatuan)}</span>
                {item.diskon > 0 && <span className="text-red-500">Disc {item.diskon}%</span>}
                {item.mekanik && <span>Mek: {item.mekanik.nama}</span>}
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-slate-400 my-2" />

        {/* Calculation Totals */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-slate-600">Subtotal</span>
            <span>{formatRupiah(tx.subtotal)}</span>
          </div>

          {tx.diskon > 0 && (
            <div className="flex justify-between text-red-600">
              <span>Diskon ({tx.diskon}%)</span>
              <span>-{formatRupiah(diskonNominal)}</span>
            </div>
          )}

          {tx.pajak > 0 && (
            <div className="flex justify-between text-slate-600">
              <span>Pajak ({tx.pajak}%)</span>
              <span>+{formatRupiah(pajakNominal)}</span>
            </div>
          )}

          <div className="border-t border-slate-800 my-1.5" />

          <div className="flex justify-between text-sm font-bold text-slate-900">
            <span>TOTAL</span>
            <span>{formatRupiah(tx.total)}</span>
          </div>

          {tx.metodePembayaran && (
            <>
              <div className="flex justify-between pt-1 text-slate-600">
                <span>Metode Bayar</span>
                <span className="font-semibold">{tx.metodePembayaran}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Dibayar</span>
                <span>{formatRupiah(tx.dibayar)}</span>
              </div>
              {tx.kembalian > 0 && (
                <div className="flex justify-between font-bold text-slate-900">
                  <span>Kembalian</span>
                  <span>{formatRupiah(tx.kembalian)}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Status Stamp */}
        <div className="my-3 py-1.5 border-y-2 border-slate-800 text-center font-bold tracking-widest text-sm">
          {tx.status === "LUNAS" ? "✓ L U N A S" : `STATUS: ${tx.status}`}
        </div>

        {/* Footer Notes */}
        <div className="text-center text-[10px] text-slate-500 space-y-1 pt-1">
          <div>{cfg.footer_invoice ?? "Terima kasih atas kunjungan Anda."}</div>
          <div className="text-[9px] text-slate-400">KasirBengkel Workshop System</div>
        </div>
      </div>
    </div>
  );
}
