"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Input, Badge, Modal } from "@/components/ui";
import { formatDate, formatRupiah, getStatusVariant } from "@/lib/utils";
import toast from "react-hot-toast";

interface Pelanggan {
  id: string;
  kode: string;
  nama: string;
  telepon?: string;
  email?: string;
  alamat?: string;
  tipe: string;
  poin: number;
  aktif: boolean;
  createdAt: string;
  _count?: { kendaraan: number; transaksi: number };
}

const TIPE_OPTIONS = [
  { value: "UMUM", label: "Umum" },
  { value: "MEMBER", label: "Member" },
  { value: "VIP", label: "VIP" },
];

const TipeBadge: React.FC<{ tipe: string }> = ({ tipe }) => {
  const map: Record<string, "default" | "success" | "secondary"> = {
    UMUM: "default",
    MEMBER: "success",
    VIP: "secondary",
  };
  return <Badge variant={map[tipe] ?? "default"}>{tipe}</Badge>;
};

const defaultForm = { nama: "", telepon: "", email: "", alamat: "", tipe: "UMUM" };

export default function PelangganPage() {
  const [data, setData] = useState<Pelanggan[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Pelanggan | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);
  const limit = 15;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/pelanggan?search=${encodeURIComponent(search)}&page=${page}&limit=${limit}`);
      const json = await res.json();
      setData(json.data ?? []);
      setTotal(json.total ?? 0);
    } catch {
      toast.error("Gagal memuat data pelanggan");
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditTarget(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (p: Pelanggan) => {
    setEditTarget(p);
    setForm({ nama: p.nama, telepon: p.telepon ?? "", email: p.email ?? "", alamat: p.alamat ?? "", tipe: p.tipe });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editTarget ? `/api/pelanggan/${editTarget.id}` : "/api/pelanggan";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success(editTarget ? "Pelanggan berhasil diperbarui" : "Pelanggan berhasil ditambahkan");
      setModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Gagal menyimpan data");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, nama: string) => {
    if (!confirm(`Nonaktifkan pelanggan "${nama}"?`)) return;
    try {
      await fetch(`/api/pelanggan/${id}`, { method: "DELETE" });
      toast.success("Pelanggan dinonaktifkan");
      fetchData();
    } catch {
      toast.error("Gagal menghapus pelanggan");
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <AppShell title="Data Pelanggan">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Data Pelanggan</h1>
            <p className="text-sm text-slate-500 mt-0.5">{total} pelanggan terdaftar</p>
          </div>
          <Button onClick={openAdd} leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>
            Tambah Pelanggan
          </Button>
        </div>

        {/* Search */}
        <div className="max-w-xs">
          <Input
            placeholder="Cari nama, telepon, kode..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="p-8 text-center text-sm text-slate-400">Memuat data...</div>
            ) : data.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-4xl mb-2">👥</div>
                <p className="text-sm text-slate-500">Tidak ada pelanggan ditemukan</p>
              </div>
            ) : (
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Kode</th>
                    <th>Nama</th>
                    <th>Telepon</th>
                    <th>Tipe</th>
                    <th>Poin</th>
                    <th>Kendaraan</th>
                    <th>Transaksi</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {data.map((p) => (
                    <tr key={p.id}>
                      <td className="font-mono text-xs text-slate-500">{p.kode}</td>
                      <td>
                        <div className="font-medium text-slate-900">{p.nama}</div>
                        {p.email && <div className="text-xs text-slate-400">{p.email}</div>}
                      </td>
                      <td className="text-slate-600">{p.telepon ?? "-"}</td>
                      <td><TipeBadge tipe={p.tipe} /></td>
                      <td className="font-semibold text-violet-600">{p.poin}</td>
                      <td className="text-center">{p._count?.kendaraan ?? 0}</td>
                      <td className="text-center">{p._count?.transaksi ?? 0}</td>
                      <td>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => openEdit(p)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-violet-700 hover:bg-violet-50 rounded-md transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.nama)}
                            className="px-2.5 py-1 text-xs font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-md transition-colors"
                          >
                            Nonaktif
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-5 py-3 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
              <p className="text-xs text-slate-500">
                Menampilkan {(page - 1) * limit + 1}–{Math.min(page * limit, total)} dari {total}
              </p>
              <div className="flex gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  ← Prev
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="px-2.5 py-1.5 text-xs rounded-md border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Tambah/Edit */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editTarget ? "Edit Pelanggan" : "Tambah Pelanggan Baru"}
        size="md"
      >
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input
            label="Nama Pelanggan"
            required
            placeholder="Masukkan nama lengkap"
            value={form.nama}
            onChange={e => setForm(f => ({ ...f, nama: e.target.value }))}
          />
          <div className="form-grid">
            <Input
              label="Telepon"
              type="tel"
              placeholder="08xx-xxxx-xxxx"
              value={form.telepon}
              onChange={e => setForm(f => ({ ...f, telepon: e.target.value }))}
            />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tipe</label>
              <select
                value={form.tipe}
                onChange={e => setForm(f => ({ ...f, tipe: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
              >
                {TIPE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <Input
            label="Email"
            type="email"
            placeholder="email@contoh.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Alamat</label>
            <textarea
              className="w-full rounded-lg border border-slate-300 text-sm px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
              rows={3}
              placeholder="Alamat lengkap pelanggan"
              value={form.alamat}
              onChange={e => setForm(f => ({ ...f, alamat: e.target.value }))}
            />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={submitting}>{editTarget ? "Simpan Perubahan" : "Tambah Pelanggan"}</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
