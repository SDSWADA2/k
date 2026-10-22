"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Input, Badge, Modal } from "@/components/ui";
import { formatRupiah } from "@/lib/utils";
import toast from "react-hot-toast";

interface SparePart {
  id: string;
  kode: string;
  nama: string;
  satuan: string;
  hargaBeli: number;
  hargaJual: number;
  stok: number;
  stokMinimum: number;
  lokasi?: string;
  aktif: boolean;
  kategoriId?: string | null;
  kategori?: { id: string; nama: string } | null;
}

interface Kategori {
  id: string;
  nama: string;
}

const defaultForm = {
  nama: "",
  kategoriId: "",
  satuan: "pcs",
  hargaBeli: "",
  hargaJual: "",
  stok: "",
  stokMinimum: "5",
  lokasi: "",
};

function StokBadge({ stok, stokMinimum }: { stok: number; stokMinimum: number }) {
  if (stok <= 0) return <Badge variant="danger">Habis ({stok})</Badge>;
  if (stok <= stokMinimum) return <Badge variant="warning">Kritis ({stok})</Badge>;
  return <Badge variant="success">Aman ({stok})</Badge>;
}

export default function SparePartPage() {
  const [data, setData] = useState<SparePart[]>([]);
  const [kategoriList, setKategoriList] = useState<Kategori[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [selectedKategori, setSelectedKategori] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<SparePart | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const limit = 15;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        search,
        page: String(page),
        limit: String(limit),
      });
      if (selectedKategori) params.set("kategoriId", selectedKategori);

      const res = await fetch(`/api/spare-part?${params}`);
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      toast.error("Gagal memuat data spare part");
    } finally {
      setLoading(false);
    }
  }, [search, page, selectedKategori]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => {
    fetch("/api/kategori").then(r => r.json()).then(setKategoriList).catch(() => {});
  }, []);

  const openAdd = () => { setEditTarget(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (p: SparePart) => {
    setEditTarget(p);
    setForm({
      nama: p.nama,
      kategoriId: p.kategoriId || p.kategori?.id || "",
      satuan: p.satuan,
      hargaBeli: String(p.hargaBeli),
      hargaJual: String(p.hargaJual),
      stok: String(p.stok),
      stokMinimum: String(p.stokMinimum),
      lokasi: p.lokasi ?? "",
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editTarget ? `/api/spare-part/${editTarget.id}` : "/api/spare-part";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success(editTarget ? "Spare part diperbarui" : "Spare part ditambahkan");
      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Gagal menyimpan");
    } finally {
      setSubmitting(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AppShell title="Spare Part">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Data Spare Part</h1>
            <p className="text-sm text-slate-500 mt-0.5">{total} item terdaftar</p>
          </div>
          <Button onClick={openAdd} leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>
            Tambah Spare Part
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="max-w-xs flex-1">
            <Input
              placeholder="Cari nama, kode..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
            />
          </div>
          <select
            value={selectedKategori}
            onChange={(e) => { setSelectedKategori(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 text-xs px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-violet-200"
          >
            <option value="">Semua Kategori</option>
            {kategoriList.map((k) => (
              <option key={k.id} value={k.id}>
                {k.nama}
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">Memuat data...</div>
            ) : data.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-4xl mb-2">📦</div>
                <p className="text-sm text-slate-500">Tidak ada spare part ditemukan</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Nama Part</th>
                    <th>Kategori</th>
                    <th>Harga Beli</th>
                    <th>Harga Jual</th>
                    <th>Satuan</th>
                    <th>Stok</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((p) => (
                    <tr key={p.id}>
                      <td className="font-mono text-xs text-slate-500">{p.kode}</td>
                      <td>
                        <div className="font-medium text-slate-900">{p.nama}</div>
                        {p.lokasi && <div className="text-xs text-slate-400">📍 {p.lokasi}</div>}
                      </td>
                      <td className="text-slate-500 text-xs">{p.kategori?.nama ?? "-"}</td>
                      <td className="text-slate-600">{formatRupiah(p.hargaBeli)}</td>
                      <td className="font-semibold text-slate-900">{formatRupiah(p.hargaJual)}</td>
                      <td className="text-slate-500">{p.satuan}</td>
                      <td><StokBadge stok={p.stok} stokMinimum={p.stokMinimum} /></td>
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => openEdit(p)} className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-violet-700 hover:bg-violet-50 rounded-md transition-colors">Edit</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-xs text-slate-500">Hal {page} dari {totalPages}</p>
              <div className="flex gap-1">
                <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors">← Prev</button>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 transition-colors">Next →</button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Edit Spare Part" : "Tambah Spare Part"} size="lg">
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="form-grid">
            <Input label="Nama Spare Part" required value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="Contoh: Oli Mesin Federal 1L" containerClassName="sm:col-span-2" />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Kategori</label>
              <select value={form.kategoriId} onChange={e => setForm(f => ({ ...f, kategoriId: e.target.value }))} className="w-full rounded-lg border border-slate-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400">
                <option value="">- Pilih Kategori -</option>
                {kategoriList.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
              </select>
            </div>
            <Input label="Satuan" required value={form.satuan} onChange={e => setForm(f => ({ ...f, satuan: e.target.value }))} placeholder="pcs / botol / set" />
            <Input label="Harga Beli (Rp)" type="number" required value={form.hargaBeli} onChange={e => setForm(f => ({ ...f, hargaBeli: e.target.value }))} placeholder="0" />
            <Input label="Harga Jual (Rp)" type="number" required value={form.hargaJual} onChange={e => setForm(f => ({ ...f, hargaJual: e.target.value }))} placeholder="0" />
            <Input label="Stok Awal" type="number" value={form.stok} onChange={e => setForm(f => ({ ...f, stok: e.target.value }))} placeholder="0" />
            <Input label="Stok Minimum" type="number" value={form.stokMinimum} onChange={e => setForm(f => ({ ...f, stokMinimum: e.target.value }))} placeholder="5" />
            <Input label="Lokasi" value={form.lokasi} onChange={e => setForm(f => ({ ...f, lokasi: e.target.value }))} placeholder="Rak A1" containerClassName="sm:col-span-2" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={submitting}>{editTarget ? "Simpan Perubahan" : "Tambah Spare Part"}</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
