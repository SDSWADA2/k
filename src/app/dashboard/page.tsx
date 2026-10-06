"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { formatRupiah } from "@/lib/utils";
import { Badge } from "@/components/ui";

interface DashboardStats {
  pendapatanHariIni: number;
  totalTransaksiHariIni: number;
  transaksiPending: number;
  pelangganBaru: number;
  stokKritis: number;
  pendapatanBulanIni: number;
}

interface RecentTransaksi {
  id: string;
  nomorInvoice: string;
  pelanggan: string | null;
  kendaraan: string | null;
  total: number;
  status: string;
  tanggal: string;
}

const StatCard: React.FC<{
  title: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  trend?: { value: number; label: string };
}> = ({ title, value, sub, icon, color, trend }) => (
  <div className="stat-card flex items-start justify-between">
    <div className="flex-1 min-w-0">
      <p className="text-sm text-slate-500 font-medium">{title}</p>
      <p className="text-2xl font-bold text-slate-900 mt-1 leading-none">{value}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-medium ${trend.value >= 0 ? "text-emerald-600" : "text-red-500"}`}>
          {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value)}% {trend.label}
        </div>
      )}
    </div>
    <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center flex-shrink-0 ml-3`}>
      {icon}
    </div>
  </div>
);

const STATUS_MAP: Record<string, { label: string; variant: "success" | "warning" | "info" | "danger" | "default" }> = {
  LUNAS: { label: "Lunas", variant: "success" },
  SELESAI: { label: "Selesai", variant: "info" },
  PROSES: { label: "Proses", variant: "info" },
  ANTRI: { label: "Antri", variant: "warning" },
  BATAL: { label: "Batal", variant: "danger" },
};

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentTx, setRecentTx] = useState<RecentTransaksi[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, txRes] = await Promise.all([
          fetch("/api/dashboard/stats"),
          fetch("/api/dashboard/recent-transaksi"),
        ]);
        if (statsRes.ok) setStats(await statsRes.json());
        if (txRes.ok) setRecentTx(await txRes.json());
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <AppShell title="Dashboard">
      <div className="space-y-6">
        {/* Page title */}
        <div>
          <h1 className="text-xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Selamat datang! Ringkasan aktivitas bengkel hari ini.
          </p>
        </div>

        {/* Stats grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="stat-card animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-7 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-3 gap-4">
            <StatCard
              title="Pendapatan Hari Ini"
              value={formatRupiah(stats?.pendapatanHariIni ?? 0)}
              sub={`${stats?.totalTransaksiHariIni ?? 0} transaksi`}
              color="bg-violet-100"
              icon={<svg className="w-5 h-5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard
              title="Transaksi Pending"
              value={String(stats?.transaksiPending ?? 0)}
              sub="Menunggu proses"
              color="bg-amber-100"
              icon={<svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
            />
            <StatCard
              title="Stok Kritis"
              value={String(stats?.stokKritis ?? 0)}
              sub="Perlu restock segera"
              color="bg-red-100"
              icon={<svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>}
            />
          </div>
        )}

        {/* Recent transactions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Transaksi Terbaru</h2>
            <a href="/transaksi" className="text-xs text-violet-600 hover:text-violet-700 font-medium">Lihat semua →</a>
          </div>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">Memuat data...</div>
            ) : recentTx.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm text-slate-500">Belum ada transaksi hari ini</p>
                <a href="/kasir" className="mt-3 inline-block text-xs font-medium text-violet-600 hover:text-violet-700">+ Buat transaksi baru</a>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Invoice</th>
                    <th>Pelanggan</th>
                    <th>Kendaraan</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Waktu</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTx.map((tx) => {
                    const s = STATUS_MAP[tx.status] ?? { label: tx.status, variant: "default" as const };
                    return (
                      <tr key={tx.id}>
                        <td>
                          <a href={`/transaksi/${tx.id}`} className="text-violet-600 hover:text-violet-700 font-medium">
                            {tx.nomorInvoice}
                          </a>
                        </td>
                        <td className="text-slate-600">{tx.pelanggan ?? "-"}</td>
                        <td className="text-slate-600 font-mono text-xs">{tx.kendaraan ?? "-"}</td>
                        <td className="font-semibold text-slate-900">{formatRupiah(tx.total)}</td>
                        <td><Badge variant={s.variant}>{s.label}</Badge></td>
                        <td className="text-slate-400 text-xs">
                          {new Date(tx.tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Transaksi Baru", href: "/kasir", color: "bg-violet-600 text-white", icon: "🧾" },
            { label: "Tambah Pelanggan", href: "/pelanggan", color: "bg-emerald-600 text-white", icon: "👤" },
            { label: "Cek Stok", href: "/spare-part", color: "bg-blue-600 text-white", icon: "📦" },
            { label: "Laporan", href: "/laporan", color: "bg-amber-500 text-white", icon: "📊" },
          ].map((a) => (
            <a
              key={a.href}
              href={a.href}
              className={`${a.color} rounded-xl p-4 flex items-center gap-3 font-medium text-sm hover:opacity-90 transition-opacity shadow-sm`}
            >
              <span className="text-xl">{a.icon}</span>
              {a.label}
            </a>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
