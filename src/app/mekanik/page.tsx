"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Input, Modal } from "@/components/ui";
import toast from "react-hot-toast";

interface Mekanik { id: string; kode: string; nama: string; telepon?: string; spesialisasi?: string; aktif: boolean; }
const defaultForm = { nama: "", telepon: "", spesialisasi: "" };

export default function MekanikPage() {
  const [data, setData] = useState<Mekanik[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Mekanik | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/mekanik");
      setData(await res.json());
    } catch { toast.error("Gagal memuat mekanik"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const openAdd = () => { setEditTarget(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (m: Mekanik) => {
    setEditTarget(m);
    setForm({ nama: m.nama, telepon: m.telepon ?? "", spesialisasi: m.spesialisasi ?? "" });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const url = editTarget ? `/api/mekanik/${editTarget.id}` : "/api/mekanik";
      const method = editTarget ? "PUT" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      toast.success(editTarget ? "Mekanik diperbarui" : "Mekanik ditambahkan");
      setModalOpen(false); fetchData();
    } catch (err: unknown) { toast.error((err as Error).message); }
    finally { setSubmitting(false); }
  };

  return (
    <AppShell title="Data Mekanik">
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Data Mekanik</h1>
            <p className="text-sm text-slate-500 mt-0.5">{data.length} mekanik terdaftar</p>
          </div>
          <Button onClick={openAdd} leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>}>
            Tambah Mekanik
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 animate-pulse">
                <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-slate-200 rounded w-1/2"></div>
              </div>
            ))
          ) : data.length === 0 ? (
            <div className="col-span-full p-10 text-center bg-white rounded-xl border border-slate-200">
              <div className="text-4xl mb-2">👨‍🔧</div>
              <p className="text-sm text-slate-500">Belum ada mekanik terdaftar</p>
            </div>
          ) : (
            data.map((m) => (
              <div key={m.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="w-10 h-10 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 font-bold text-sm flex-shrink-0">
                    {m.nama.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-xs font-mono text-slate-400">{m.kode}</span>
                </div>
                <div className="mt-3">
                  <h3 className="font-semibold text-slate-900">{m.nama}</h3>
                  {m.spesialisasi && <p className="text-xs text-violet-600 mt-0.5 font-medium">🔧 {m.spesialisasi}</p>}
                  {m.telepon && <p className="text-xs text-slate-500 mt-0.5">📱 {m.telepon}</p>}
                </div>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => openEdit(m)} className="text-xs text-slate-600 hover:text-violet-700 font-medium px-2 py-1 hover:bg-violet-50 rounded-md transition-colors">Edit</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editTarget ? "Edit Mekanik" : "Tambah Mekanik"} size="sm">
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <Input label="Nama Mekanik" required value={form.nama} onChange={e => setForm(f => ({ ...f, nama: e.target.value }))} placeholder="Nama lengkap mekanik" />
          <Input label="Telepon" type="tel" value={form.telepon} onChange={e => setForm(f => ({ ...f, telepon: e.target.value }))} placeholder="08xx-xxxx-xxxx" />
          <Input label="Spesialisasi" value={form.spesialisasi} onChange={e => setForm(f => ({ ...f, spesialisasi: e.target.value }))} placeholder="Motor Matic, Kelistrikan, dll" />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>Batal</Button>
            <Button type="submit" loading={submitting}>{editTarget ? "Simpan" : "Tambah"}</Button>
          </div>
        </form>
      </Modal>
    </AppShell>
  );
}
