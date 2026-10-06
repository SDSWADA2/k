"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { formatRupiah } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";

interface ChartData { label: string; total: number; count: number; }
interface LaporanData { chartData: ChartData[]; totalPendapatan: number; totalTransaksi: number; }

export default function LaporanPage() {
  const [data, setData] = useState<LaporanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [groupBy, setGroupBy] = useState<"day" | "month">("day");
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split("T")[0];
  });
  const [to, setTo] = useState(() => new Date().toISOString().split("T")[0]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/laporan/pendapatan?from=${from}&to=${to}&groupBy=${groupBy}`);
      if (!res.ok) throw new Error("Gagal memuat laporan");
      setData(await res.json());
    } catch { toast.error("Gagal memuat laporan"); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, [from, to, groupBy]);

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; payload: ChartData }>; label?: string }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-sm">
          <p className="font-semibold text-slate-900 mb-1">{label}</p>
          <p className="text-violet-700 font-bold">{formatRupiah(payload[0].value)}</p>
          <p className="text-slate-500 text-xs">{payload[0].payload.count} transaksi</p>
        </div>
      );
    }
    return null;
  };

  return (
    <AppShell title="Laporan">
      <div className="space-y-5">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Laporan Pendapatan</h1>
          <p className="text-sm text-slate-500 mt-0.5">Analisis pendapatan bengkel berdasarkan periode</p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Dari Tanggal</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)}
                className="rounded-lg border border-slate-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Sampai Tanggal</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)}
                className="rounded-lg border border-slate-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Grup Per</label>
              <div className="flex gap-1">
                {(["day", "month"] as const).map(g => (
                  <button key={g} onClick={() => setGroupBy(g)}
                    className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${groupBy === g ? "bg-violet-600 text-white border-violet-600" : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"}`}>
                    {g === "day" ? "Hari" : "Bulan"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="stat-card">
            <p className="text-sm text-slate-500 font-medium">Total Pendapatan</p>
            <p className="text-2xl font-bold text-violet-700 mt-1">{formatRupiah(data?.totalPendapatan ?? 0)}</p>
            <p className="text-xs text-slate-400 mt-1">Dari transaksi lunas</p>
          </div>
          <div className="stat-card">
            <p className="text-sm text-slate-500 font-medium">Total Transaksi</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{data?.totalTransaksi ?? 0}</p>
            <p className="text-xs text-slate-400 mt-1">Transaksi berhasil</p>
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-4">Grafik Pendapatan</h2>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-sm text-slate-400">Memuat grafik...</div>
          ) : !data || data.chartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-sm">Tidak ada data untuk periode ini</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={data.chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "#f5f3ff" }} />
                <Bar dataKey="total" fill="#7c3aed" radius={[6, 6, 0, 0]} maxBarSize={60} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Detail table */}
        {data && data.chartData.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100">
              <h2 className="text-sm font-semibold text-slate-800">Rincian Per Periode</h2>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Periode</th>
                    <th className="text-right">Jumlah Transaksi</th>
                    <th className="text-right">Total Pendapatan</th>
                    <th className="text-right">Rata-rata</th>
                  </tr>
                </thead>
                <tbody>
                  {data.chartData.map((row) => (
                    <tr key={row.label}>
                      <td className="font-mono text-sm">{row.label}</td>
                      <td className="text-right text-slate-600">{row.count}</td>
                      <td className="text-right font-semibold text-slate-900">{formatRupiah(row.total)}</td>
                      <td className="text-right text-slate-500">{formatRupiah(row.count > 0 ? row.total / row.count : 0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
