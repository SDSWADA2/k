"use client";

import React, { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Input } from "@/components/ui";
import toast from "react-hot-toast";

interface Setting { kunci: string; nilai: string; }
const LABELS: Record<string, string> = {
  nama_bengkel: "Nama Bengkel",
  alamat_bengkel: "Alamat",
  telepon_bengkel: "Telepon",
  email_bengkel: "Email",
  pajak_persen: "Pajak (%)",
  footer_invoice: "Footer Invoice",
};

export default function PengaturanPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/pengaturan")
      .then(r => r.json())
      .then((data: Setting[]) => {
        const obj: Record<string, string> = {};
        data.forEach(s => { obj[s.kunci] = s.nilai; });
        setSettings(obj);
      })
      .catch(() => toast.error("Gagal memuat pengaturan"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await fetch("/api/pengaturan", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });
      toast.success("Pengaturan berhasil disimpan!");
    } catch { toast.error("Gagal menyimpan pengaturan"); }
    finally { setSaving(false); }
  };

  const keys = Object.keys(LABELS);

  return (
    <AppShell title="Pengaturan">
      <div className="space-y-5 max-w-2xl">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Pengaturan Bengkel</h1>
          <p className="text-sm text-slate-500 mt-0.5">Konfigurasi data bengkel dan preferensi sistem</p>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="text-sm font-semibold text-slate-800">Informasi Bengkel</h2>
          </div>
          <div className="p-5 space-y-4">
            {loading ? (
              <div className="space-y-3">
                {[1,2,3,4].map(i => (
                  <div key={i} className="h-10 bg-slate-100 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : (
              keys.map(key => (
                key === "footer_invoice" ? (
                  <div key={key}>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{LABELS[key]}</label>
                    <textarea
                      className="w-full rounded-lg border border-slate-300 text-sm px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
                      rows={3}
                      value={settings[key] ?? ""}
                      onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                      placeholder="Teks footer yang tampil di invoice..."
                    />
                  </div>
                ) : (
                  <Input
                    key={key}
                    label={LABELS[key]}
                    value={settings[key] ?? ""}
                    onChange={e => setSettings(s => ({ ...s, [key]: e.target.value }))}
                    type={key === "pajak_persen" ? "number" : "text"}
                    placeholder={key === "pajak_persen" ? "0" : `Masukkan ${LABELS[key].toLowerCase()}...`}
                  />
                )
              ))
            )}
          </div>
          <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 rounded-b-xl flex justify-end">
            <Button type="submit" loading={saving}>
              💾 Simpan Pengaturan
            </Button>
          </div>
        </form>

        {/* App info */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-slate-800 mb-3">Informasi Aplikasi</h2>
          <div className="space-y-2 text-sm text-slate-600">
            <div className="flex justify-between"><span>Versi</span><span className="font-medium">1.0.0</span></div>
            <div className="flex justify-between"><span>Framework</span><span className="font-medium">Next.js 14</span></div>
            <div className="flex justify-between"><span>Database</span><span className="font-medium">SQLite (Prisma ORM)</span></div>
            <div className="flex justify-between"><span>Build</span><span className="font-medium text-violet-600">KasirBengkel © 2024</span></div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
