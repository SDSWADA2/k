"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Input, Modal } from "@/components/ui";
import { formatDateTime, formatRupiah } from "@/lib/utils";
import toast from "react-hot-toast";

interface Kendaraan {
  id: string;
  nomorPolisi: string;
  merek: string;
  model: string;
  tahun?: number | null;
  warna?: string | null;
  jenis: string;
  transmisi?: string | null;
  catatan?: string | null;
  pelangganId?: string;
  pelanggan?: { id: string; nama: string; telepon?: string | null } | null;
}

interface Pelanggan {
  id: string;
  kode: string;
  nama: string;
  telepon?: string | null;
}

interface HistoryItem {
  id: string;
  nomorInvoice: string;
  tanggal: string;
  total: number;
  status: string;
  catatanKeluhan?: string | null;
  detail: Array<{
    id: string;
    nama: string;
    jumlah: number;
    subtotal: number;
    mekanik?: { nama: string } | null;
  }>;
}

const defaultForm = {
  pelangganId: "",
  nomorPolisi: "",
  merek: "",
  model: "",
  tahun: "",
  warna: "",
  jenis: "MOTOR",
  transmisi: "",
  catatan: "",
};

const JENIS_OPTIONS = [
  { value: "MOTOR", label: "Motor" },
  { value: "MOBIL", label: "Mobil" },
  { value: "TRUK", label: "Truk" },
  { value: "LAINNYA", label: "Lainnya" },
];

export default function KendaraanPage() {
  const [data, setData] = useState<Kendaraan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const [pelangganSearch, setPelangganSearch] = useState("");
  const [pelangganList, setPelangganList] = useState<Pelanggan[]>([]);
  const [selectedPelanggan, setSelectedPelanggan] = useState<Pelanggan | null>(null);

  // History Modal
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Kendaraan | null>(null);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const handleViewHistory = async (k: Kendaraan) => {
    setSelectedVehicle(k);
    setLoadingHistory(true);
    setHistoryModalOpen(true);
    try {
      const res = await fetch(`/api/kendaraan/${k.id}/riwayat`);
      if (res.ok) setHistoryList(await res.json());
    } catch {
      toast.error("Gagal memuat riwayat");
    } finally {
      setLoadingHistory(false);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/kendaraan?search=${encodeURIComponent(search)}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      toast.error("Gagal memuat kendaraan");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!pelangganSearch) {
      setPelangganList([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(`/api/pelanggan?search=${encodeURIComponent(pelangganSearch)}&limit=8`);
        const json = await res.json();
        setPelangganList(json.data ?? []);
      } catch {
        /* skip */
      }
    }, 300);
    return () => clearTimeout(t);
  }, [pelangganSearch]);

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(defaultForm);
    setSelectedPelanggan(null);
    setPelangganSearch("");
    setModalOpen(true);
  };

  const handleOpenEdit = (k: Kendaraan) => {
    setEditingId(k.id);
    setForm({
      pelangganId: k.pelangganId || (k.pelanggan ? k.pelanggan.id : ""),
      nomorPolisi: k.nomorPolisi,
      merek: k.merek,
      model: k.model,
      tahun: k.tahun ? String(k.tahun) : "",
      warna: k.warna || "",
      jenis: k.jenis || "MOTOR",
      transmisi: k.transmisi || "",
      catatan: k.catatan || "",
    });
    if (k.pelanggan) {
      setSelectedPelanggan({
        id: k.pelanggan.id,
        kode: "",
        nama: k.pelanggan.nama,
        telepon: k.pelanggan.telepon || "",
      });
    } else {
      setSelectedPelanggan(null);
    }
    setPelangganSearch("");
    setModalOpen(true);
  };

  const handleDelete = async (id: string, nopol: string) => {
    if (!window.confirm(`Yakin ingin menghapus kendaraan ${nopol}?`)) return;
    try {
      const res = await fetch(`/api/kendaraan/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal menghapus kendaraan");
      toast.success("Kendaraan berhasil dihapus");
      fetchData();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPelanggan && !editingId) {
      toast.error("Pilih pelanggan terlebih dahulu");
      return;
    }
    setSubmitting(true);
    try {
      const url = editingId ? `/api/kendaraan/${editingId}` : "/api/kendaraan";
      const method = editingId ? "PUT" : "POST";
      const payload = {
        ...form,
        ...(selectedPelanggan && { pelangganId: selectedPelanggan.id }),
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success(editingId ? "Kendaraan berhasil diperbarui" : "Kendaraan berhasil ditambahkan");
      setModalOpen(false);
      fetchData();
      setForm(defaultForm);
      setSelectedPelanggan(null);
      setEditingId(null);
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  const JENIS_ICON: Record<string, string> = { MOTOR: "🏍️", MOBIL: "🚗", TRUK: "🚛", LAINNYA: "🚌" };

  return (
    <AppShell title="Data Kendaraan">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Data Kendaraan</h1>
            <p className="text-sm text-slate-500 mt-0.5">{data.length} kendaraan terdaftar</p>
          </div>
          <Button
            onClick={handleOpenAdd}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            }
          >
            Tambah Kendaraan
          </Button>
        </div>

        <div className="max-w-xs">
          <Input
            placeholder="Cari nopol, merek, model..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            }
          />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">Memuat data...</div>
            ) : data.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-4xl mb-2">🚗</div>
                <p className="text-sm text-slate-500">Tidak ada kendaraan ditemukan</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Nopol</th>
                    <th>Kendaraan</th>
                    <th>Tahun</th>
                    <th>Warna</th>
                    <th>Pemilik</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((k) => (
                    <tr key={k.id}>
                      <td>
                        <span className="font-mono font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">
                          {k.nomorPolisi}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{JENIS_ICON[k.jenis] ?? "🚗"}</span>
                          <div>
                            <p className="font-medium text-slate-900">
                              {k.merek} {k.model}
                            </p>
                            <p className="text-xs text-slate-400">{k.jenis}</p>
                          </div>
                        </div>
                      </td>
                      <td className="text-slate-600">{k.tahun ?? "-"}</td>
                      <td className="text-slate-600">{k.warna ?? "-"}</td>
                      <td>
                        <div>
                          <p className="text-sm font-medium text-slate-900">{k.pelanggan?.nama ?? "-"}</p>
                          <p className="text-xs text-slate-400">{k.pelanggan?.telepon}</p>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleViewHistory(k)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-violet-50 hover:bg-violet-600 text-violet-700 hover:text-white transition-colors"
                            title="Lihat Rekam Jejak Servis"
                          >
                            📋 Riwayat
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(k)}
                            className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                            title="Edit Data Kendaraan"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(k.id, k.nomorPolisi)}
                            className="px-2 py-1 text-xs font-semibold rounded-lg bg-red-50 hover:bg-red-600 text-red-600 hover:text-white transition-colors"
                            title="Hapus Kendaraan"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>

      {/* Modal Tambah / Edit Kendaraan */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingId ? "Edit Kendaraan" : "Tambah Kendaraan"}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Pelanggan search */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pemilik Kendaraan <span className="text-red-500">*</span>
            </label>
            {selectedPelanggan ? (
              <div className="flex items-center justify-between bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
                <span className="text-sm font-medium text-slate-900">
                  {selectedPelanggan.nama} {selectedPelanggan.telepon ? `— ${selectedPelanggan.telepon}` : ""}
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedPelanggan(null)}
                  className="text-xs text-red-500 hover:underline"
                >
                  Ganti
                </button>
              </div>
            ) : (
              <div className="relative">
                <Input
                  placeholder="Cari nama pelanggan..."
                  value={pelangganSearch}
                  onChange={(e) => setPelangganSearch(e.target.value)}
                />
                {pelangganList.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
                    {pelangganList.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          setSelectedPelanggan(p);
                          setPelangganSearch("");
                          setPelangganList([]);
                        }}
                        className="w-full text-left px-3 py-2.5 hover:bg-violet-50 text-sm border-b border-slate-100 last:border-0"
                      >
                        <span className="font-medium">{p.nama}</span>
                        <span className="ml-2 text-slate-400 text-xs">{p.telepon}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Nomor Polisi"
              required
              value={form.nomorPolisi}
              onChange={(e) => setForm((f) => ({ ...f, nomorPolisi: e.target.value.toUpperCase() }))}
              placeholder="L 1234 AB"
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Jenis</label>
              <select
                value={form.jenis}
                onChange={(e) => setForm((f) => ({ ...f, jenis: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
              >
                {JENIS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Merek"
              required
              value={form.merek}
              onChange={(e) => setForm((f) => ({ ...f, merek: e.target.value }))}
              placeholder="Honda, Yamaha..."
            />
            <Input
              label="Model"
              required
              value={form.model}
              onChange={(e) => setForm((f) => ({ ...f, model: e.target.value }))}
              placeholder="Beat, Mio, Scoopy..."
            />
            <Input
              label="Tahun"
              type="number"
              value={form.tahun}
              onChange={(e) => setForm((f) => ({ ...f, tahun: e.target.value }))}
              placeholder="2021"
            />
            <Input
              label="Warna"
              value={form.warna}
              onChange={(e) => setForm((f) => ({ ...f, warna: e.target.value }))}
              placeholder="Merah, Putih..."
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" loading={submitting}>
              {editingId ? "Simpan Perubahan" : "Tambah Kendaraan"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Service History Modal */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Riwayat Servis ${selectedVehicle?.nomorPolisi ?? ""}`}
        size="lg"
      >
        <div className="p-5 space-y-3">
          {selectedVehicle && (
            <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 text-sm">{selectedVehicle.nomorPolisi}</span>
                <span className="text-slate-500 ml-2">
                  {selectedVehicle.merek} {selectedVehicle.model}
                </span>
              </div>
              <span className="text-slate-500 font-medium">Pemilik: {selectedVehicle.pelanggan?.nama}</span>
            </div>
          )}

          {loadingHistory ? (
            <div className="p-8 text-center text-xs text-slate-400">Memuat riwayat servis...</div>
          ) : historyList.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 italic">
              Belum ada riwayat transaksi servis untuk kendaraan ini.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {historyList.map((item) => (
                <div key={item.id} className="py-3 space-y-1.5 text-xs">
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-violet-700">{item.nomorInvoice}</span>
                    <span className="text-slate-400">{formatDateTime(item.tanggal)}</span>
                  </div>
                  {item.catatanKeluhan && (
                    <p className="text-slate-600 italic bg-amber-50/50 p-1.5 rounded">
                      Keluhan: &quot;{item.catatanKeluhan}&quot;
                    </p>
                  )}
                  <div className="space-y-0.5 pl-2">
                    {item.detail.map((d) => (
                      <div key={d.id} className="flex justify-between text-[11px] text-slate-600">
                        <span>
                          • {d.nama} ({d.jumlah}x)
                        </span>
                        <span className="font-semibold text-slate-800">{formatRupiah(d.subtotal)}</span>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end pt-1">
                    <span className="font-bold text-slate-900">Total: {formatRupiah(item.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>
    </AppShell>
  );
}
