"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { formatRupiah } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

interface ChartData {
  label: string;
  total: number;
  count: number;
}

interface LaporanData {
  chartData: ChartData[];
  totalPendapatan: number;
  totalTransaksi: number;
}

export default function LaporanPage() {
  const [data, setData] = useState<LaporanData | null>(null);
  const [loading, setLoading] = useState(false);
  const [groupBy, setGroupBy] = useState<"day" | "month">("day");

  // Date range
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
    } catch {
      toast.error("Gagal memuat laporan");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [from, to, groupBy]);

  // Date Presets
  const handleSetPreset = (preset: "today" | "thisMonth" | "lastMonth" | "thisYear") => {
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    if (preset === "today") {
      setFrom(todayStr);
      setTo(todayStr);
      setGroupBy("day");
    } else if (preset === "thisMonth") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      setFrom(start.toISOString().split("T")[0]);
      setTo(todayStr);
      setGroupBy("day");
    } else if (preset === "lastMonth") {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      setFrom(start.toISOString().split("T")[0]);
      setTo(end.toISOString().split("T")[0]);
      setGroupBy("day");
    } else if (preset === "thisYear") {
      const start = new Date(now.getFullYear(), 0, 1);
      setFrom(start.toISOString().split("T")[0]);
      setTo(todayStr);
      setGroupBy("month");
    }
  };

  // Export to Excel
  const handleExportExcel = async () => {
    if (!data || data.chartData.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    try {
      toast.loading("Mempersiapkan data Excel...", { id: "excel" });

      // Fetch all transaction details for the period
      const txRes = await fetch(`/api/transaksi?limit=1000`);
      let allTx: any[] = [];
      if (txRes.ok) {
        const json = await txRes.json();
        allTx = json.data ?? [];
      }

      // Sheet 1: Rincian Periode
      const periodRows = data.chartData.map((row, idx) => ({
        No: idx + 1,
        Periode: row.label,
        "Jumlah Transaksi": row.count,
        "Total Pendapatan (Rp)": row.total,
        "Rata-rata Transaksi (Rp)": Math.round(row.count > 0 ? row.total / row.count : 0),
      }));

      // Add Total Summary row
      periodRows.push({
        No: "" as any,
        Periode: "TOTAL",
        "Jumlah Transaksi": data.totalTransaksi,
        "Total Pendapatan (Rp)": data.totalPendapatan,
        "Rata-rata Transaksi (Rp)": Math.round(
          data.totalTransaksi > 0 ? data.totalPendapatan / data.totalTransaksi : 0
        ),
      });

      const wsPeriod = XLSX.utils.json_to_sheet(periodRows);

      // Sheet 2: Data Transaksi
      const txRows = allTx.map((tx, idx) => ({
        No: idx + 1,
        "No Invoice": tx.nomorInvoice,
        Tanggal: new Date(tx.tanggal).toLocaleString("id-ID"),
        Pelanggan: tx.pelanggan?.nama ?? "Umum",
        "No Polisi": tx.kendaraan?.nomorPolisi ?? "-",
        "Kendaraan": tx.kendaraan ? `${tx.kendaraan.merek} ${tx.kendaraan.model}` : "-",
        Status: tx.status,
        "Metode Bayar": tx.metodePembayaran ?? "-",
        "Total (Rp)": tx.total,
      }));

      const wsTx = XLSX.utils.json_to_sheet(txRows);

      // Create Workbook
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, wsPeriod, "Ringkasan Pendapatan");
      XLSX.utils.book_append_sheet(wb, wsTx, "Daftar Transaksi");

      const filename = `Laporan_Pendapatan_${from}_sd_${to}.xlsx`;
      XLSX.writeFile(wb, filename);

      toast.success(`Berhasil download ${filename}!`, { id: "excel" });
    } catch (err: unknown) {
      console.error(err);
      toast.error("Gagal mengekspor data ke Excel", { id: "excel" });
    }
  };

  const CustomTooltip = ({
    active,
    payload,
    label,
  }: {
    active?: boolean;
    payload?: Array<{ value: number; payload: ChartData }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 rounded-xl shadow-xl px-4 py-3 text-sm">
          <p className="font-semibold text-slate-900 mb-1">{label}</p>
          <p className="text-violet-700 font-bold">{formatRupiah(payload[0].value)}</p>
          <p className="text-slate-500 text-xs">{payload[0].payload.count} transaksi lunas</p>
        </div>
      );
    }
    return null;
  };

  const avgPerTransaksi =
    data && data.totalTransaksi > 0 ? Math.round(data.totalPendapatan / data.totalTransaksi) : 0;

  return (
    <AppShell title="Laporan">
      <div className="space-y-6">
        {/* Header & Export Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Laporan Pendapatan &amp; Finansial</h1>
            <p className="text-sm text-slate-500 mt-0.5">Analisis pendapatan, transaksi bengkel, dan ekspor data</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-colors flex items-center gap-1.5"
            >
              🖨️ Cetak Ringkasan
            </button>
            <button
              onClick={handleExportExcel}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors flex items-center gap-2"
            >
              📥 Export Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Filter Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
          <div className="flex flex-wrap items-center gap-2 pb-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-500">Preset Periode:</span>
            <button
              onClick={() => handleSetPreset("today")}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-violet-100 text-slate-700 hover:text-violet-700 transition-colors"
            >
              Hari Ini
            </button>
            <button
              onClick={() => handleSetPreset("thisMonth")}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-violet-100 text-slate-700 hover:text-violet-700 transition-colors"
            >
              Bulan Ini
            </button>
            <button
              onClick={() => handleSetPreset("lastMonth")}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-violet-100 text-slate-700 hover:text-violet-700 transition-colors"
            >
              Bulan Lalu
            </button>
            <button
              onClick={() => handleSetPreset("thisYear")}
              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-100 hover:bg-violet-100 text-slate-700 hover:text-violet-700 transition-colors"
            >
              Tahun Ini
            </button>
          </div>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Dari Tanggal</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-lg border border-slate-300 text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Sampai Tanggal</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-lg border border-slate-300 text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Dikelompokkan Per</label>
              <div className="flex gap-1">
                {(["day", "month"] as const).map((g) => (
                  <button
                    key={g}
                    onClick={() => setGroupBy(g)}
                    className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-all ${
                      groupBy === g
                        ? "bg-violet-600 text-white border-violet-600"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {g === "day" ? "Harian" : "Bulanan"}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Metric Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="stat-card">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Pendapatan</p>
            <p className="text-2xl font-bold text-violet-700 mt-1">{formatRupiah(data?.totalPendapatan ?? 0)}</p>
            <p className="text-xs text-slate-400 mt-0.5">Dari transaksi lunas pada periode ini</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Transaksi</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{data?.totalTransaksi ?? 0}</p>
            <p className="text-xs text-slate-400 mt-0.5">Unit servis &amp; penjualan</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Rata-rata Transaksi</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{formatRupiah(avgPerTransaksi)}</p>
            <p className="text-xs text-slate-400 mt-0.5">Nilai rata-rata nota / SPK</p>
          </div>
        </div>

        {/* Chart Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-slate-800">Grafik Trend Pendapatan</h2>
            <span className="text-xs text-slate-400">Periode: {from} s/d {to}</span>
          </div>
          {loading ? (
            <div className="h-64 flex items-center justify-center text-sm text-slate-400">Memuat grafik...</div>
          ) : !data || data.chartData.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400">
              <div className="text-4xl mb-2">📊</div>
              <p className="text-sm">Tidak ada transaksi lunas untuk periode ini</p>
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

        {/* Detail Table */}
        {data && data.chartData.length > 0 && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-800">Rincian Data Per Periode</h2>
              <span className="text-xs text-slate-400">{data.chartData.length} baris data</span>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Periode</th>
                    <th className="text-right">Jumlah Transaksi</th>
                    <th className="text-right">Total Pendapatan</th>
                    <th className="text-right">Rata-rata / Nota</th>
                  </tr>
                </thead>
                <tbody>
                  {data.chartData.map((row) => (
                    <tr key={row.label}>
                      <td className="font-mono text-xs font-semibold text-slate-700">{row.label}</td>
                      <td className="text-right text-slate-600">{row.count} nota</td>
                      <td className="text-right font-bold text-slate-900">{formatRupiah(row.total)}</td>
                      <td className="text-right text-slate-500 font-medium">
                        {formatRupiah(row.count > 0 ? row.total / row.count : 0)}
                      </td>
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
