"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Input, Badge, Modal } from "@/components/ui";
import { formatRupiah } from "@/lib/utils";
import toast from "react-hot-toast";

// =========== Types ===========
interface Pelanggan { id: string; kode: string; nama: string; telepon?: string; }
interface Kendaraan { id: string; nomorPolisi: string; merek: string; model: string; jenis: string; }
interface SparePart { id: string; kode: string; nama: string; hargaJual: number; stok: number; satuan: string; }
interface JasaService { id: string; kode: string; nama: string; harga: number; }
interface Mekanik { id: string; kode: string; nama: string; }

interface CartItem {
  id: string;
  tipe: "SPARE_PART" | "JASA_SERVICE";
  refId: string;
  nama: string;
  hargaSatuan: number;
  jumlah: number;
  diskon: number;
  subtotal: number;
}

const calcSubtotal = (item: CartItem) => item.hargaSatuan * item.jumlah * (1 - item.diskon / 100);

// =========== Search Combobox ===========
function SearchDropdown<T extends { id: string; nama: string }>({
  placeholder, onSelect, fetchUrl, renderItem,
}: {
  placeholder: string;
  onSelect: (item: T) => void;
  fetchUrl: (q: string) => string;
  renderItem: (item: T) => React.ReactNode;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<T[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!query) { setResults([]); return; }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(fetchUrl(query));
        const json = await res.json();
        setResults(Array.isArray(json) ? json : json.data ?? []);
      } catch { setResults([]); }
    }, 300);
    return () => clearTimeout(t);
  }, [query, fetchUrl]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Input
        placeholder={placeholder}
        value={query}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>}
      />
      {open && results.length > 0 && (
        <div className="absolute z-20 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {results.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => { onSelect(item); setQuery(""); setOpen(false); }}
              className="w-full text-left px-3 py-2.5 hover:bg-violet-50 text-sm border-b border-slate-100 last:border-0 transition-colors"
            >
              {renderItem(item)}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// =========== Main POS Page ===========
export default function KasirPage() {
  const [pelanggan, setPelanggan] = useState<Pelanggan | null>(null);
  const [kendaraan, setKendaraan] = useState<Kendaraan | null>(null);
  const [kendaraanList, setKendaraanList] = useState<Kendaraan[]>([]);
  const [mekanikList, setMekanikList] = useState<Mekanik[]>([]);
  const [selectedMekanik, setSelectedMekanik] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [catatan, setCatatan] = useState("");
  const [diskonGlobal, setDiskonGlobal] = useState(0);
  const [payModalOpen, setPayModalOpen] = useState(false);
  const [metodePembayaran, setMetodePembayaran] = useState("TUNAI");
  const [dibayar, setDibayar] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Fetch mekanik list
  useEffect(() => {
    fetch("/api/mekanik").then(r => r.json()).then(setMekanikList).catch(() => {});
  }, []);

  // Fetch kendaraan when pelanggan selected
  useEffect(() => {
    if (!pelanggan) { setKendaraanList([]); setKendaraan(null); return; }
    fetch(`/api/kendaraan?pelangganId=${pelanggan.id}`)
      .then(r => r.json())
      .then(setKendaraanList)
      .catch(() => {});
  }, [pelanggan]);

  // Cart calculations
  const subtotalItems = cart.reduce((s, i) => s + calcSubtotal(i), 0);
  const diskonRp = subtotalItems * (diskonGlobal / 100);
  const total = subtotalItems - diskonRp;
  const dibayarNum = parseFloat(dibayar.replace(/[^0-9.]/g, "")) || 0;
  const kembalian = Math.max(0, dibayarNum - total);
  const kurang = Math.max(0, total - dibayarNum);

  const addSparePart = (sp: SparePart) => {
    const existing = cart.find(c => c.refId === sp.id && c.tipe === "SPARE_PART");
    if (existing) {
      setCart(c => c.map(i => i.refId === sp.id && i.tipe === "SPARE_PART"
        ? { ...i, jumlah: i.jumlah + 1, subtotal: calcSubtotal({ ...i, jumlah: i.jumlah + 1 }) }
        : i));
    } else {
      const item: CartItem = {
        id: crypto.randomUUID(), tipe: "SPARE_PART", refId: sp.id,
        nama: sp.nama, hargaSatuan: sp.hargaJual, jumlah: 1, diskon: 0,
        subtotal: sp.hargaJual,
      };
      setCart(c => [...c, item]);
    }
    toast.success(`${sp.nama} ditambahkan`, { duration: 1500 });
  };

  const addJasa = (j: JasaService) => {
    const item: CartItem = {
      id: crypto.randomUUID(), tipe: "JASA_SERVICE", refId: j.id,
      nama: j.nama, hargaSatuan: j.harga, jumlah: 1, diskon: 0,
      subtotal: j.harga,
    };
    setCart(c => [...c, item]);
    toast.success(`${j.nama} ditambahkan`, { duration: 1500 });
  };

  const updateQty = (id: string, jumlah: number) => {
    if (jumlah < 1) { removeItem(id); return; }
    setCart(c => c.map(i => i.id === id ? { ...i, jumlah, subtotal: calcSubtotal({ ...i, jumlah }) } : i));
  };

  const removeItem = (id: string) => setCart(c => c.filter(i => i.id !== id));

  const handleBayar = async () => {
    if (cart.length === 0) { toast.error("Keranjang masih kosong!"); return; }
    if (metodePembayaran === "TUNAI" && dibayarNum < total) {
      toast.error("Jumlah bayar kurang dari total!"); return;
    }
    setSubmitting(true);
    try {
      const detail = cart.map(item => ({
        tipe: item.tipe,
        sparePartId: item.tipe === "SPARE_PART" ? item.refId : undefined,
        jasaServiceId: item.tipe === "JASA_SERVICE" ? item.refId : undefined,
        mekanikId: selectedMekanik || undefined,
        nama: item.nama,
        jumlah: item.jumlah,
        hargaSatuan: item.hargaSatuan,
        diskon: item.diskon,
      }));

      const res = await fetch("/api/transaksi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pelangganId: pelanggan?.id,
          kendaraanId: kendaraan?.id,
          catatanKeluhan: catatan,
          detail,
          diskon: diskonGlobal,
          metodePembayaran,
          dibayar: dibayarNum,
        }),
      });

      if (!res.ok) { const err = await res.json(); throw new Error(err.error); }
      const tx = await res.json();

      toast.success(`✅ Transaksi ${tx.nomorInvoice} berhasil!`);
      // Reset form
      setCart([]); setPelanggan(null); setKendaraan(null); setCatatan("");
      setDiskonGlobal(0); setDibayar(""); setPayModalOpen(false);

      // Open invoice in new tab
      window.open(`/transaksi/${tx.id}/invoice`, "_blank");
    } catch (err: unknown) {
      toast.error((err as Error).message ?? "Gagal menyimpan transaksi");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="Kasir / POS">
      <div className="space-y-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Kasir / Point of Sale</h1>
          <p className="text-sm text-slate-500 mt-0.5">Buat transaksi service baru</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* ===== Left: Pelanggan + Produk ===== */}
          <div className="xl:col-span-3 space-y-4">

            {/* Pelanggan & Kendaraan */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 bg-violet-100 rounded-md flex items-center justify-center text-violet-600 text-xs font-bold">1</span>
                Pelanggan &amp; Kendaraan
              </h2>

              {pelanggan ? (
                <div className="flex items-center justify-between bg-violet-50 border border-violet-200 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{pelanggan.nama}</p>
                    <p className="text-xs text-slate-500">{pelanggan.telepon}</p>
                  </div>
                  <button onClick={() => { setPelanggan(null); setKendaraan(null); }} className="text-xs text-red-500 hover:text-red-700">Ganti</button>
                </div>
              ) : (
                <SearchDropdown<Pelanggan>
                  placeholder="Cari pelanggan (nama/telepon)..."
                  onSelect={(p) => { setPelanggan(p); }}
                  fetchUrl={(q) => `/api/pelanggan?search=${encodeURIComponent(q)}&limit=8`}
                  renderItem={(p) => (
                    <div>
                      <span className="font-medium">{p.nama}</span>
                      <span className="ml-2 text-slate-400 text-xs">{p.telepon}</span>
                    </div>
                  )}
                />
              )}

              {pelanggan && kendaraanList.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">Kendaraan</label>
                  <select
                    value={kendaraan?.id ?? ""}
                    onChange={e => setKendaraan(kendaraanList.find(k => k.id === e.target.value) ?? null)}
                    className="w-full rounded-lg border border-slate-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
                  >
                    <option value="">- Pilih Kendaraan -</option>
                    {kendaraanList.map(k => (
                      <option key={k.id} value={k.id}>{k.nomorPolisi} — {k.merek} {k.model}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Mekanik</label>
                <select
                  value={selectedMekanik}
                  onChange={e => setSelectedMekanik(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
                >
                  <option value="">- Pilih Mekanik -</option>
                  {mekanikList.map(m => <option key={m.id} value={m.id}>{m.nama}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">Keluhan / Catatan</label>
                <textarea
                  className="w-full rounded-lg border border-slate-300 text-sm px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-violet-100 focus:border-violet-400"
                  rows={2}
                  placeholder="Deskripsi keluhan pelanggan..."
                  value={catatan}
                  onChange={e => setCatatan(e.target.value)}
                />
              </div>
            </div>

            {/* Add Items */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 bg-violet-100 rounded-md flex items-center justify-center text-violet-600 text-xs font-bold">2</span>
                Tambah Spare Part / Jasa
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1.5">🔩 Spare Part</p>
                  <SearchDropdown<SparePart>
                    placeholder="Cari spare part..."
                    onSelect={addSparePart}
                    fetchUrl={(q) => `/api/spare-part?search=${encodeURIComponent(q)}&limit=8`}
                    renderItem={(p) => (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{p.nama}</span>
                        <span className="text-xs text-slate-400">{formatRupiah(p.hargaJual)} · stok {p.stok}</span>
                      </div>
                    )}
                  />
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-1.5">🔧 Jasa Service</p>
                  <SearchDropdown<JasaService>
                    placeholder="Cari jasa service..."
                    onSelect={addJasa}
                    fetchUrl={(q) => `/api/jasa-service?search=${encodeURIComponent(q)}`}
                    renderItem={(j) => (
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{j.nama}</span>
                        <span className="text-xs text-slate-400">{formatRupiah(j.harga)}</span>
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ===== Right: Cart & Payment ===== */}
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-4">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800">
                  🛒 Keranjang
                  {cart.length > 0 && (
                    <span className="ml-1.5 bg-violet-600 text-white text-xs rounded-full px-1.5 py-0.5">{cart.length}</span>
                  )}
                </h2>
                {cart.length > 0 && (
                  <button onClick={() => setCart([])} className="text-xs text-red-500 hover:text-red-700">Kosongkan</button>
                )}
              </div>

              {/* Cart items */}
              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">
                    <div className="text-3xl mb-1">🛒</div>
                    Keranjang masih kosong
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="px-4 py-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Badge variant={item.tipe === "SPARE_PART" ? "info" : "secondary"} size="sm">
                              {item.tipe === "SPARE_PART" ? "Part" : "Jasa"}
                            </Badge>
                            <p className="text-xs font-medium text-slate-900 truncate">{item.nama}</p>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">{formatRupiah(item.hargaSatuan)} × {item.jumlah}</p>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button onClick={() => updateQty(item.id, item.jumlah - 1)} className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 text-sm font-bold transition-colors">−</button>
                          <span className="w-6 text-center text-xs font-medium">{item.jumlah}</span>
                          <button onClick={() => updateQty(item.id, item.jumlah + 1)} className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-600 text-sm font-bold transition-colors">+</button>
                          <button onClick={() => removeItem(item.id)} className="w-6 h-6 flex items-center justify-center hover:bg-red-50 rounded text-slate-300 hover:text-red-500 transition-colors ml-0.5">×</button>
                        </div>
                      </div>
                      <div className="flex justify-end mt-1">
                        <span className="text-xs font-semibold text-slate-900">{formatRupiah(calcSubtotal(item))}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Summary */}
              <div className="border-t border-slate-200 px-4 py-3 space-y-2 bg-slate-50/50">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>Subtotal</span>
                  <span>{formatRupiah(subtotalItems)}</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-500">Diskon (%)</span>
                  <input
                    type="number"
                    min={0} max={100}
                    value={diskonGlobal}
                    onChange={e => setDiskonGlobal(parseFloat(e.target.value) || 0)}
                    className="w-16 text-right text-xs border border-slate-300 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-violet-300"
                  />
                </div>
                {diskonGlobal > 0 && (
                  <div className="flex justify-between text-xs text-red-500">
                    <span>Diskon {diskonGlobal}%</span>
                    <span>-{formatRupiah(diskonRp)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                  <span>Total</span>
                  <span className="text-base text-violet-700">{formatRupiah(total)}</span>
                </div>
              </div>

              {/* Pay button */}
              <div className="px-4 pb-4 pt-2">
                <Button
                  className="w-full"
                  size="lg"
                  disabled={cart.length === 0}
                  onClick={() => { setDibayar(String(total)); setPayModalOpen(true); }}
                  leftIcon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>}
                >
                  Proses Pembayaran
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Payment Modal */}
      <Modal isOpen={payModalOpen} onClose={() => setPayModalOpen(false)} title="Konfirmasi Pembayaran" size="sm">
        <div className="p-5 space-y-4">
          <div className="bg-slate-50 rounded-xl p-4 text-center">
            <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Total Tagihan</p>
            <p className="text-3xl font-bold text-violet-700 mt-1">{formatRupiah(total)}</p>
            {pelanggan && <p className="text-xs text-slate-500 mt-1">Pelanggan: {pelanggan.nama}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Metode Pembayaran</label>
            <div className="grid grid-cols-3 gap-2">
              {["TUNAI", "TRANSFER", "QRIS"].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetodePembayaran(m)}
                  className={`py-2 text-xs font-semibold rounded-lg border transition-all ${metodePembayaran === m ? "border-violet-500 bg-violet-50 text-violet-700" : "border-slate-200 text-slate-600 hover:border-slate-300"}`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {metodePembayaran === "TUNAI" && (
            <>
              <Input
                label="Jumlah Dibayar (Rp)"
                type="number"
                value={dibayar}
                onChange={e => setDibayar(e.target.value)}
                placeholder={String(total)}
              />
              <div className={`flex justify-between text-sm font-semibold rounded-lg px-3 py-2 ${kembalian > 0 ? "bg-emerald-50 text-emerald-700" : kurang > 0 ? "bg-red-50 text-red-600" : "bg-slate-50 text-slate-600"}`}>
                <span>{kurang > 0 ? "Kekurangan" : "Kembalian"}</span>
                <span>{formatRupiah(kurang > 0 ? kurang : kembalian)}</span>
              </div>
            </>
          )}

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setPayModalOpen(false)}>Batal</Button>
            <Button
              className="flex-1"
              loading={submitting}
              onClick={handleBayar}
              disabled={metodePembayaran === "TUNAI" && dibayarNum < total}
            >
              ✓ Selesaikan
            </Button>
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
