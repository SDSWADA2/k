"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Badge, Input } from "@/components/ui";
import { formatDateTime, formatRupiah } from "@/lib/utils";
import toast from "react-hot-toast";

interface Transaksi {
  id: string;
  nomorInvoice: string;
  pelanggan?: { nama: string; telepon: string };
  kendaraan?: { nomorPolisi: string; merek: string; model: string };
  kasir?: { nama: string };
  total: number;
  status: string;
  metodePembayaran?: string;
  tanggal: string;
  _count: { detail: number };
}

const STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "info" | "danger" | "default" }> = {
  LUNAS: { label: "Lunas", variant: "success" },
  SELESAI: { label: "Selesai", variant: "info" },
  PROSES: { label: "Proses", variant: "info" },
  ANTRI: { label: "Antri", variant: "warning" },
  BATAL: { label: "Batal", variant: "danger" },
};

const STATUS_FILTERS = [
  { value: "", label: "Semua" },
  { value: "ANTRI", label: "Antri" },
  { value: "PROSES", label: "Proses" },
  { value: "SELESAI", label: "Selesai" },
  { value: "LUNAS", label: "Lunas" },
  { value: "BATAL", label: "Batal" },
];

export default function TransaksiPage() {
  const [data, setData] = useState<Transaksi[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const limit = 15;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ search, page: String(page), limit: String(limit) });
      if (statusFilter) params.set("status", statusFilter);
      const res = await fetch(`/api/transaksi?${params}`);
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      toast.error("Gagal memuat data transaksi");
    } finally {
      setLoading(false);
    }
  }, [search, page, statusFilter]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      await fetch(`/api/transaksi/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      toast.success("Status diperbarui");
      fetchData();
    } catch {
      toast.error("Gagal update status");
    }
  };

  const handleCancel = async (id: string, invoice: string) => {
    if (!confirm(`Batalkan transaksi ${invoice}?`)) return;
    try {
      const res = await fetch(`/api/transaksi/${id}`, { method: "DELETE" });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      toast.success("Transaksi dibatalkan");
      fetchData();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Gagal membatalkan transaksi");
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AppShell title="Riwayat Transaksi">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Riwayat Transaksi</h1>
            <p className="text-sm text-slate-500 mt-0.5">{total} transaksi tercatat</p>
          </div>
          <a href="/kasir" className="inline-flex items-center gap-2 bg-violet-600 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-violet-700 transition-colors shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            Transaksi Baru
          </a>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <div className="max-w-xs flex-1">
            <Input
              placeholder="Cari invoice, pelanggan, nopol..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            />
          </div>
          <div className="flex gap-1 flex-wrap">
            {STATUS_FILTERS.map(f => (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setPage(1); }}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${statusFilter === f.value ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">Memuat data...</div>
            ) : data.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm text-slate-500">Tidak ada transaksi ditemukan</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Pelanggan</th>
                    <th>Kendaraan</th>
                    <th>Item</th>
                    <th>Total</th>
                    <th>Metode</th>
                    <th>Status</th>
                    <th>Tanggal</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((tx) => {
                    const s = STATUS_MAP[tx.status] ?? { label: tx.status, variant: "default" as const };
                    return (
                      <tr key={tx.id}>
                        <td>
                          <a href={`/transaksi/${tx.id}`} className="text-violet-600 hover:text-violet-700 font-mono text-xs font-semibold">
                            {tx.nomorInvoice}
                          </a>
                        </td>
                        <td className="text-slate-700">{tx.pelanggan?.nama ?? <span className="text-slate-400">-</span>}</td>
                        <td className="font-mono text-xs text-slate-600">{tx.kendaraan?.nomorPolisi ?? "-"}</td>
                        <td className="text-center text-slate-500">{tx._count.detail}</td>
                        <td className="font-semibold text-slate-900">{formatRupiah(tx.total)}</td>
                        <td>
                          {tx.metodePembayaran ? (
                            <Badge variant="default" size="sm">{tx.metodePembayaran}</Badge>
                          ) : <span className="text-slate-300">-</span>}
                        </td>
                        <td><Badge variant={s.variant}>{s.label}</Badge></td>
                        <td className="text-xs text-slate-400">{formatDateTime(tx.tanggal)}</td>
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <Link href={`/transaksi/${tx.id}`} className="px-2.5 py-1 text-xs font-semibold text-slate-700 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors">
                              Detail
                            </Link>
                            <a href={`/transaksi/${tx.id}/invoice`} target="_blank" className="px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100 rounded-lg transition-colors">
                              🖨️ Cetak
                            </a>
                            {tx.status === "ANTRI" && (
                              <button onClick={() => handleUpdateStatus(tx.id, "PROSES")} className="px-2 py-1 text-xs font-semibold text-amber-700 hover:bg-amber-50 rounded-lg transition-colors">
                                Kerjakan
                              </button>
                            )}
                            {tx.status === "PROSES" && (
                              <button onClick={() => handleUpdateStatus(tx.id, "SELESAI")} className="px-2 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors">
                                Selesai
                              </button>
                            )}
                            {(tx.status === "ANTRI" || tx.status === "PROSES") && (
                              <button onClick={() => handleCancel(tx.id, tx.nomorInvoice)} className="px-2 py-1 text-xs font-medium text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                                Batal
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-xs text-slate-500">Hal {page} dari {totalPages} · {total} transaksi</p>
              <div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors">← Prev</button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors">Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
