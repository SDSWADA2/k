"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { formatRupiah } from "@/lib/utils";
import { Badge } from "@/components/ui";
import Link from "next/link";

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
  href?: string;
}> = ({ title, value, sub, icon, color, href }) => {
  const content = (
    <div className="stat-card flex items-start justify-between hover:shadow-md transition-shadow">
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-extrabold text-slate-900 mt-1 leading-tight">{value}</p>
        {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
      </div>
      <div className={`w-11 h-11 ${color} rounded-2xl flex items-center justify-center flex-shrink-0 ml-3 shadow-sm`}>
        {icon}
      </div>
    </div>
  );

  return href ? <Link href={href}>{content}</Link> : content;
};

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
    <AppShell title="Dashboard Bengkel">
      <div className="space-y-6">
        {/* Welcome Header & Quick Action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-extrabold text-slate-900">Dashboard Manajemen Bengkel</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Ringkasan operasional harian, transaksi servis, dan inventaris bengkel
            </p>
          </div>
          <Link
            href="/kasir"
            className="inline-flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-sm px-4 py-2.5 rounded-xl shadow-md transition-colors"
          >
            <span>🧾 Transaksi / Kasir Baru</span>
          </Link>
        </div>

        {/* Action Banners */}
        {stats && stats.stokKritis > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="text-2xl">⚠️</span>
              <div>
                <p className="text-sm font-bold text-amber-900">
                  Perhatian: {stats.stokKritis} Item Spare Part Mendekati Batas Kritis / Habis!
                </p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Lakukan pengadaan ulang (restock) ke supplier agar pengerjaan servis tidak terhambat.
                </p>
              </div>
            </div>
            <Link
              href="/stok"
              className="px-4 py-2 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-sm transition-colors text-center whitespace-nowrap"
            >
              Cek &amp; Restock Part →
            </Link>
          </div>
        )}

        {/* 6 Key Stats Grid */}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Pendapatan Hari Ini"
              value={formatRupiah(stats?.pendapatanHariIni ?? 0)}
              sub={`${stats?.totalTransaksiHariIni ?? 0} transaksi tercatat hari ini`}
              color="bg-violet-100"
              icon={
                <svg className="w-5 h-5 text-violet-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              href="/laporan"
            />
            <StatCard
              title="Omzet Bulan Ini"
              value={formatRupiah(stats?.pendapatanBulanIni ?? 0)}
              sub="Akumulasi pendapatan bulan berjalan"
              color="bg-emerald-100"
              icon={
                <svg className="w-5 h-5 text-emerald-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              }
              href="/laporan"
            />
            <StatCard
              title="Antrian / Pending"
              value={String(stats?.transaksiPending ?? 0)}
              sub="Unit sedang/menunggu pengerjaan"
              color="bg-amber-100"
              icon={
                <svg className="w-5 h-5 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              }
              href="/transaksi"
            />
            <StatCard
              title="Stok Menipis / Kritis"
              value={String(stats?.stokKritis ?? 0)}
              sub="Spare part di bawah minimum"
              color="bg-red-100"
              icon={
                <svg className="w-5 h-5 text-red-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              }
              href="/stok"
            />
            <StatCard
              title="Pelanggan Baru Bulan Ini"
              value={String(stats?.pelangganBaru ?? 0)}
              sub="Pertumbuhan basis pelanggan"
              color="bg-blue-100"
              icon={
                <svg className="w-5 h-5 text-blue-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              }
              href="/pelanggan"
            />
            <StatCard
              title="Unit Servis Hari Ini"
              value={String(stats?.totalTransaksiHariIni ?? 0)}
              sub="Total nota transaksi masuk"
              color="bg-indigo-100"
              icon={
                <svg className="w-5 h-5 text-indigo-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              }
              href="/transaksi"
            />
          </div>
        )}

        {/* Quick Access Menu Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Kasir / POS", href: "/kasir", color: "bg-violet-600 text-white", desc: "Buka nota transaksi", icon: "🧾" },
            { label: "Stok & Pembelian", href: "/stok", color: "bg-blue-600 text-white", desc: "Audit & restock PO", icon: "📦" },
            { label: "Data Pelanggan", href: "/pelanggan", color: "bg-emerald-600 text-white", desc: "Kelola member & motor", icon: "👥" },
            { label: "Laporan Finansial", href: "/laporan", color: "bg-amber-600 text-white", desc: "Export Excel & grafik", icon: "📊" },
          ].map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className={`${a.color} rounded-2xl p-4 flex flex-col justify-between hover:opacity-95 transition-all shadow-sm hover:shadow`}
            >
              <div className="flex items-center justify-between">
                <span className="text-2xl">{a.icon}</span>
                <span className="text-xs opacity-75 font-semibold">Buka →</span>
              </div>
              <div className="mt-3">
                <p className="font-bold text-sm leading-tight">{a.label}</p>
                <p className="text-[11px] opacity-80 mt-0.5">{a.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Transactions Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Transaksi Servis Terbaru</h2>
              <p className="text-xs text-slate-400">Pengerjaan dan pembayaran terbaru di bengkel</p>
            </div>
            <Link href="/transaksi" className="text-xs text-violet-600 hover:text-violet-700 font-bold">
              Lihat semua transaksi →
            </Link>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">Memuat transaksi terbaru...</div>
            ) : recentTx.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-sm text-slate-500 font-medium">Belum ada transaksi tercatat hari ini</p>
                <Link
                  href="/kasir"
                  className="mt-3 inline-block text-xs font-bold text-violet-700 hover:underline"
                >
                  + Buat Transaksi Pertama
                </Link>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>No. Invoice</th>
                    <th>Pelanggan</th>
                    <th>Kendaraan</th>
                    <th>Total</th>
                    <th>Status</th>
                    <th>Waktu</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTx.map((tx) => {
                    const s = STATUS_MAP[tx.status] ?? { label: tx.status, variant: "default" as const };
                    return (
                      <tr key={tx.id}>
                        <td>
                          <Link
                            href={`/transaksi/${tx.id}`}
                            className="text-violet-700 hover:text-violet-900 font-mono text-xs font-bold"
                          >
                            {tx.nomorInvoice}
                          </Link>
                        </td>
                        <td className="font-medium text-slate-900">{tx.pelanggan ?? "Pelanggan Umum"}</td>
                        <td>
                          {tx.kendaraan ? (
                            <span className="font-mono text-xs font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                              {tx.kendaraan}
                            </span>
                          ) : (
                            <span className="text-slate-400 text-xs">-</span>
                          )}
                        </td>
                        <td className="font-extrabold text-slate-900">{formatRupiah(tx.total)}</td>
                        <td>
                          <Badge variant={s.variant}>{s.label}</Badge>
                        </td>
                        <td className="text-slate-400 text-xs font-mono">
                          {new Date(tx.tanggal).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td>
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/transaksi/${tx.id}`}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-600 hover:text-violet-700 hover:bg-violet-50 rounded-lg transition-colors"
                            >
                              Detail
                            </Link>
                            <a
                              href={`/transaksi/${tx.id}/invoice`}
                              target="_blank"
                              className="px-2.5 py-1 text-xs font-semibold text-violet-700 hover:bg-violet-100 rounded-lg transition-colors"
                            >
                              Cetak
                            </a>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
