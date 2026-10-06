"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Input, Modal } from "@/components/ui";
import { formatRupiah } from "@/lib/utils";
import toast from "react-hot-toast";

interface JasaService { id: string; kode: string; nama: string; deskripsi?: string; harga: number; estimasiJam?: number; aktif: boolean; }
const defaultForm = { nama: "", deskripsi: "", harga: "", estimasiJam: "" };

export default function JasaServicePage() {
  const [data, setData] = useState<JasaService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<JasaService | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/jasa-service?search=${encodeURIComponent(search)}`);
      const json = await res.json();
      setData(Array.isArray(json) ? json : []);
    } catch { toast.error("Gagal memuat jasa service"); }
    finally { setLoading(false); }
  }, [search]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditTarget(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (j: JasaService) => {
    setEditTarget(j);
    setForm({ nama: j.nama, deskripsi: j.deskripsi ?? "", harga: String(j.harga), estimasiJam: j.estimasiJam ? String(j.estimasiJam) : "" });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editTarget ? `/api/jasa-service/${editTarget.id}` : "/api/jasa-service";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success(editTarget ? "Jasa diperbarui" : "Jasa ditambahkan");
      setModalOpen(false); fetchData();
    } catch (err: unknown) { toast.error((err as Error).message); }
    finally { setSubmitting(false); }
  };

  const filtered = data.filter(j => j.nama.toLowerCase().includes(search.toLowerCase()));

  return (
    <AppShell title="Jasa Service">
      <div className="space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Jasa Service</h1>
            <p className="text-sm text-slate-500 mt-0.5">{data.length} jasa terdaftar</p>
          </div>
          <Button onClick={openAdd} leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>
            Tambah Jasa
          </Button>
        </div>

        <div className="max-w-xs">
          <Input placeholder="Cari jasa..." value={search} onChange={e => setSearch(e.target.value)}
            leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>} />
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">Memuat data...</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center"><div className="text-4xl mb-2">🔧</div><p className="text-sm text-slate-500">Tidak ada jasa ditemukan</p></div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr><th>Kode</th><th>Nama Jasa</th><th>Deskripsi</th><th>Estimasi</th><th>Harga</th><th className="text-right">Aksi</th></tr>
                </thead>
                <tbody>
                  {filtered.map((j) => (
                    <tr key={j.id}>
                      <td className="font-mono text-xs text-slate-400">{j.kode}</td>
                      <td className="font-medium text-slate-900">{j.nama}</td>
                      <td className="text-slate-500 text-xs max-w-xs truncate">{j.deskripsi ?? "-"}</td>
                      <td className="text-slate-500">{j.estimasiJam ? `${j.estimasiJam} jam` : "-"}</td>
                      <td className="font-semibold text-violet-700">{formatRupiah(j.harga)}</td>
                      <td>
                        <div className="flex justify-end gap-1">
                          <button onClick={() => openEdit(j)} className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-violet-700 hover:bg-violet-50 rounded-md transition-colors">Edit</button>
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

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Edit Jasa Service" : "Tambah Jasa Service"} size="md">
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input label="Nama Jasa" required value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="Contoh: Ganti Oli Mesin" />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Deskripsi</label>
            <textarea className="w-full rounded-lg border border-slate-300 text-sm px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400" rows={2}
              value={form.deskripsi} onChange={e => setForm(f => ({ ...f, deskripsi: e.target.value }))} placeholder="Deskripsi singkat jasa..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Harga (Rp)" type="number" required value={form.harga} onChange={e => setForm(f => ({ ...f, harga: e.target.value }))} placeholder="0" />
            <Input label="Estimasi (jam)" type="number" step="0.5" value={form.estimasiJam} onChange={e => setForm(f => ({ ...f, estimasiJam: e.target.value }))} placeholder="1" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={submitting}>{editTarget ? "Simpan" : "Tambah Jasa"}</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
