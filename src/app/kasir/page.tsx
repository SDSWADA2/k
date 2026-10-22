"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Input, Badge, Modal } from "@/components/ui";
import { formatDateTime, formatRupiah } from "@/lib/utils";
import toast from "react-hot-toast";

// =========== Types ===========
interface Pelanggan {
  id: string;
  kode: string;
  nama: string;
  telepon?: string;
  poin?: number;
  tipe?: string;
}

interface Kendaraan {
  id: string;
  nomorPolisi: string;
  merek: string;
  model: string;
  jenis: string;
}

interface SparePart {
  id: string;
  kode: string;
  nama: string;
  hargaJual: number;
  stok: number;
  satuan: string;
}

interface JasaService {
  id: string;
  kode: string;
  nama: string;
  harga: number;
}

interface Mekanik {
  id: string;
  kode: string;
  nama: string;
}

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

interface HeldCart {
  id: string;
  label: string;
  timestamp: string;
  pelanggan: Pelanggan | null;
  kendaraan: Kendaraan | null;
  selectedMekanik: string;
  catatan: string;
  cart: CartItem[];
  diskonGlobal: number;
}

interface RiwayatItem {
  id: string;
  nomorInvoice: string;
  tanggal: string;
  total: number;
  status: string;
  catatanKeluhan?: string;
  detail: Array<{
    id: string;
    nama: string;
    jumlah: number;
    subtotal: number;
    mekanik?: { nama: string };
  }>;
}

const calcSubtotal = (item: CartItem) =>
  item.hargaSatuan * item.jumlah * (1 - item.diskon / 100);

// =========== Search Combobox ===========
function SearchDropdown<T extends { id: string; nama: string }>({
  placeholder,
  onSelect,
  fetchUrl,
  renderItem,
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
    if (!query) {
      setResults([]);
      return;
    }
    const t = setTimeout(async () => {
      try {
        const res = await fetch(fetchUrl(query));
        const json = await res.json();
        setResults(Array.isArray(json) ? json : json.data ?? []);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query, fetchUrl]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <Input
        placeholder={placeholder}
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        leftIcon={
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        }
      />
      {open && results.length > 0 && (
        <div className="absolute z-30 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-60 overflow-y-auto">
          {results.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => {
                onSelect(item);
                setQuery("");
                setOpen(false);
              }}
              className="w-full text-left px-3.5 py-2.5 hover:bg-violet-50 text-sm border-b border-slate-100 last:border-0 transition-colors"
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

  // Quick Add Pelanggan & Kendaraan Modals
  const [quickPelangganModal, setQuickPelangganModal] = useState(false);
  const [quickNama, setQuickNama] = useState("");
  const [quickTelepon, setQuickTelepon] = useState("");
  const [quickNopol, setQuickNopol] = useState("");
  const [quickMerek, setQuickMerek] = useState("");
  const [quickModel, setQuickModel] = useState("");

  // Quick Add Kendaraan only
  const [quickKendaraanModal, setQuickKendaraanModal] = useState(false);
  const [nopolBaru, setNopolBaru] = useState("");
  const [merekBaru, setMerekBaru] = useState("");
  const [modelBaru, setModelBaru] = useState("");

  // Vehicle Service History
  const [historyModalOpen, setHistoryModalOpen] = useState(false);
  const [serviceHistory, setServiceHistory] = useState<RiwayatItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Held Carts / Drafts (LocalStorage)
  const [heldCarts, setHeldCarts] = useState<HeldCart[]>([]);
  const [heldModalOpen, setHeldModalOpen] = useState(false);

  // Load held carts from LocalStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("KASIR_HELD_CARTS");
      if (saved) setHeldCarts(JSON.parse(saved));
    } catch {
      /* ignore */
    }
  }, []);

  const saveHeldCartsToStorage = (carts: HeldCart[]) => {
    setHeldCarts(carts);
    try {
      localStorage.setItem("KASIR_HELD_CARTS", JSON.stringify(carts));
    } catch {
      /* ignore */
    }
  };

  // Fetch mekanik list
  useEffect(() => {
    fetch("/api/mekanik")
      .then((r) => r.json())
      .then(setMekanikList)
      .catch(() => {});
  }, []);

  // Fetch kendaraan when pelanggan selected
  useEffect(() => {
    if (!pelanggan) {
      setKendaraanList([]);
      setKendaraan(null);
      return;
    }
    fetch(`/api/kendaraan?pelangganId=${pelanggan.id}`)
      .then((r) => r.json())
      .then((list) => {
        setKendaraanList(list);
        if (list.length === 1) {
          setKendaraan(list[0]);
        }
      })
      .catch(() => {});
  }, [pelanggan]);

  // Fetch Vehicle Service History
  const handleOpenVehicleHistory = async () => {
    if (!kendaraan) return;
    setLoadingHistory(true);
    setHistoryModalOpen(true);
    try {
      const res = await fetch(`/api/kendaraan/${kendaraan.id}/riwayat`);
      if (res.ok) {
        setServiceHistory(await res.json());
      }
    } catch {
      toast.error("Gagal memuat riwayat kendaraan");
    } finally {
      setLoadingHistory(false);
    }
  };

  // Cart calculations
  const subtotalItems = cart.reduce((s, i) => s + calcSubtotal(i), 0);
  const diskonRp = subtotalItems * (diskonGlobal / 100);
  const total = subtotalItems - diskonRp;
  const dibayarNum = parseFloat(dibayar.replace(/[^0-9.]/g, "")) || 0;
  const kembalian = Math.max(0, dibayarNum - total);
  const kurang = Math.max(0, total - dibayarNum);

  const addSparePart = (sp: SparePart) => {
    if (sp.stok <= 0) {
      toast.error(`Stok ${sp.nama} sudah habis!`);
      return;
    }
    const existing = cart.find((c) => c.refId === sp.id && c.tipe === "SPARE_PART");
    if (existing) {
      if (existing.jumlah + 1 > sp.stok) {
        toast.error(`Stok tidak mencukupi (sisa: ${sp.stok})`);
        return;
      }
      setCart((c) =>
        c.map((i) =>
          i.refId === sp.id && i.tipe === "SPARE_PART"
            ? { ...i, jumlah: i.jumlah + 1, subtotal: calcSubtotal({ ...i, jumlah: i.jumlah + 1 }) }
            : i
        )
      );
    } else {
      const item: CartItem = {
        id: crypto.randomUUID(),
        tipe: "SPARE_PART",
        refId: sp.id,
        nama: sp.nama,
        hargaSatuan: sp.hargaJual,
        jumlah: 1,
        diskon: 0,
        subtotal: sp.hargaJual,
      };
      setCart((c) => [...c, item]);
    }
    toast.success(`${sp.nama} ditambahkan`, { duration: 1200 });
  };

  const addJasa = (j: JasaService) => {
    const item: CartItem = {
      id: crypto.randomUUID(),
      tipe: "JASA_SERVICE",
      refId: j.id,
      nama: j.nama,
      hargaSatuan: j.harga,
      jumlah: 1,
      diskon: 0,
      subtotal: j.harga,
    };
    setCart((c) => [...c, item]);
    toast.success(`${j.nama} ditambahkan`, { duration: 1200 });
  };

  const updateQty = (id: string, jumlah: number) => {
    if (jumlah < 1) {
      removeItem(id);
      return;
    }
    setCart((c) => c.map((i) => (i.id === id ? { ...i, jumlah, subtotal: calcSubtotal({ ...i, jumlah }) } : i)));
  };

  const removeItem = (id: string) => setCart((c) => c.filter((i) => i.id !== id));

  // Hold / Save Draft Cart
  const handleHoldCart = () => {
    if (cart.length === 0) {
      toast.error("Keranjang masih kosong");
      return;
    }

    const label = pelanggan
      ? `${pelanggan.nama} ${kendaraan ? `(${kendaraan.nomorPolisi})` : ""}`
      : `Draft Transaksi ${heldCarts.length + 1}`;

    const newHold: HeldCart = {
      id: crypto.randomUUID(),
      label,
      timestamp: new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      pelanggan,
      kendaraan,
      selectedMekanik,
      catatan,
      cart,
      diskonGlobal,
    };

    saveHeldCartsToStorage([newHold, ...heldCarts]);
    // Reset active cart
    setCart([]);
    setPelanggan(null);
    setKendaraan(null);
    setCatatan("");
    setDiskonGlobal(0);
    toast.success(`Transaksi "${label}" ditahan & disimpan!`);
  };

  // Restore Held Cart
  const handleRestoreCart = (h: HeldCart) => {
    setCart(h.cart);
    setPelanggan(h.pelanggan);
    setKendaraan(h.kendaraan);
    setSelectedMekanik(h.selectedMekanik);
    setCatatan(h.catatan);
    setDiskonGlobal(h.diskonGlobal);

    // Remove from held
    saveHeldCartsToStorage(heldCarts.filter((c) => c.id !== h.id));
    setHeldModalOpen(false);
    toast.success(`Transaksi "${h.label}" dipulihkan ke keranjang!`);
  };

  const handleDeleteHeld = (id: string) => {
    saveHeldCartsToStorage(heldCarts.filter((c) => c.id !== id));
  };

  // Quick Add Pelanggan & Kendaraan
  const handleQuickAddPelanggan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickNama.trim()) {
      toast.error("Nama pelanggan wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      // 1. Create Pelanggan
      const resP = await fetch("/api/pelanggan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nama: quickNama, telepon: quickTelepon, tipe: "UMUM" }),
      });
      if (!resP.ok) throw new Error("Gagal membuat pelanggan");
      const newPelanggan = await resP.json();

      let newKendaraanObj = null;

      // 2. If Nopol provided, create Kendaraan immediately
      if (quickNopol.trim()) {
        const resK = await fetch("/api/kendaraan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            pelangganId: newPelanggan.id,
            nomorPolisi: quickNopol.trim().toUpperCase(),
            merek: quickMerek.trim() || "Honda",
            model: quickModel.trim() || "Beat",
            jenis: "MOTOR",
          }),
        });
        if (resK.ok) {
          newKendaraanObj = await resK.json();
        }
      }

      setPelanggan(newPelanggan);
      if (newKendaraanObj) {
        setKendaraan(newKendaraanObj);
        setKendaraanList([newKendaraanObj]);
      }

      toast.success("Pelanggan baru berhasil didaftarkan & dipilih!");
      setQuickPelangganModal(false);
      setQuickNama("");
      setQuickTelepon("");
      setQuickNopol("");
      setQuickMerek("");
      setQuickModel("");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // Quick Add Kendaraan to existing Pelanggan
  const handleQuickAddKendaraan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pelanggan) return;
    if (!nopolBaru.trim()) {
      toast.error("Nomor polisi wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/kendaraan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pelangganId: pelanggan.id,
          nomorPolisi: nopolBaru.trim().toUpperCase(),
          merek: merekBaru.trim() || "Honda",
          model: modelBaru.trim() || "Vario",
          jenis: "MOTOR",
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const created = await res.json();
      setKendaraanList((prev) => [...prev, created]);
      setKendaraan(created);
      toast.success(`Kendaraan ${created.nomorPolisi} berhasil ditambahkan!`);
      setQuickKendaraanModal(false);
      setNopolBaru("");
      setMerekBaru("");
      setModelBaru("");
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Checkout / Bayar
  const handleBayar = async () => {
    if (cart.length === 0) {
      toast.error("Keranjang masih kosong!");
      return;
    }
    if (metodePembayaran === "TUNAI" && dibayarNum < total) {
      toast.error("Jumlah bayar kurang dari total tagihan!");
      return;
    }

    setSubmitting(true);
    try {
      const detail = cart.map((item) => ({
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

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      const tx = await res.json();

      toast.success(`✅ Transaksi ${tx.nomorInvoice} Berhasil!`, { duration: 4000 });

      // Reset form
      setCart([]);
      setPelanggan(null);
      setKendaraan(null);
      setCatatan("");
      setDiskonGlobal(0);
      setDibayar("");
      setPayModalOpen(false);

      // Open receipt in new window
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
        {/* Header with Title and Held Orders Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Point of Sale (Kasir)</h1>
            <p className="text-sm text-slate-500 mt-0.5">Buat nota servis kendaraan dan penjualan spare part</p>
          </div>

          <div className="flex items-center gap-2">
            {heldCarts.length > 0 && (
              <button
                onClick={() => setHeldModalOpen(true)}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-bold rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-sm transition-colors"
              >
                <span>⏳ Transaksi Ditahan</span>
                <span className="w-5 h-5 rounded-full bg-white text-amber-700 font-bold flex items-center justify-center text-[11px]">
                  {heldCarts.length}
                </span>
              </button>
            )}

            {cart.length > 0 && (
              <button
                onClick={handleHoldCart}
                className="px-3.5 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors border border-slate-300"
                title="Tahan transaksi untuk melayani pelanggan lain"
              >
                ⏸️ Tahan Antrian
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          {/* ===== Left: Pelanggan + Produk ===== */}
          <div className="xl:col-span-3 space-y-4">
            {/* Step 1: Pelanggan & Kendaraan */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                  <span className="w-6 h-6 bg-violet-100 rounded-md flex items-center justify-center text-violet-600 text-xs font-bold">
                    1
                  </span>
                  Data Pelanggan &amp; Kendaraan
                </h2>
                {!pelanggan && (
                  <button
                    onClick={() => setQuickPelangganModal(true)}
                    className="text-xs font-bold text-violet-700 hover:text-violet-900 bg-violet-50 hover:bg-violet-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    + Pelanggan Baru
                  </button>
                )}
              </div>

              {pelanggan ? (
                <div className="bg-violet-50/70 border border-violet-200 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{pelanggan.nama}</span>
                        {pelanggan.tipe && <Badge variant="secondary">{pelanggan.tipe}</Badge>}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">📞 {pelanggan.telepon || "Tanpa Telepon"}</p>
                    </div>
                    <button
                      onClick={() => {
                        setPelanggan(null);
                        setKendaraan(null);
                      }}
                      className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1 hover:bg-red-50 rounded"
                    >
                      Ganti
                    </button>
                  </div>

                  {/* Vehicle selection for this customer */}
                  <div className="pt-2 border-t border-violet-200/60">
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-700">Pilih Kendaraan Servis:</label>
                      <button
                        onClick={() => setQuickKendaraanModal(true)}
                        className="text-[11px] font-bold text-violet-700 hover:underline"
                      >
                        + Tambah Kendaraan
                      </button>
                    </div>

                    {kendaraanList.length > 0 ? (
                      <div className="flex items-center gap-2">
                        <select
                          value={kendaraan?.id ?? ""}
                          onChange={(e) =>
                            setKendaraan(kendaraanList.find((k) => k.id === e.target.value) ?? null)
                          }
                          className="flex-1 rounded-lg border border-slate-300 bg-white text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200"
                        >
                          <option value="">- Pilih Kendaraan -</option>
                          {kendaraanList.map((k) => (
                            <option key={k.id} value={k.id}>
                              {k.nomorPolisi} — {k.merek} {k.model}
                            </option>
                          ))}
                        </select>
                        {kendaraan && (
                          <button
                            type="button"
                            onClick={handleOpenVehicleHistory}
                            className="px-2.5 py-2 text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg shadow-sm transition-colors whitespace-nowrap"
                            title="Lihat riwayat perbaikan motor ini"
                          >
                            📋 Riwayat Servis
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 bg-white p-2 rounded-lg border border-slate-200 flex justify-between items-center">
                        <span>Belum ada data kendaraan terdaftar.</span>
                        <button
                          onClick={() => setQuickKendaraanModal(true)}
                          className="text-violet-700 font-bold hover:underline"
                        >
                          Daftarkan Nopol
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <SearchDropdown<Pelanggan>
                  placeholder="Cari pelanggan (ketik nama atau nomor HP)..."
                  onSelect={(p) => setPelanggan(p)}
                  fetchUrl={(q) => `/api/pelanggan?search=${encodeURIComponent(q)}&limit=8`}
                  renderItem={(p) => (
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold text-slate-800">{p.nama}</span>
                        <span className="ml-2 text-slate-400 text-xs">{p.telepon}</span>
                      </div>
                      {p.tipe && <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">{p.tipe}</span>}
                    </div>
                  )}
                />
              )}

              {/* Mekanik & Catatan */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mekanik Penanggung Jawab</label>
                  <select
                    value={selectedMekanik}
                    onChange={(e) => setSelectedMekanik(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-violet-200"
                  >
                    <option value="">- Tanpa Mekanik / Pembelian Spare Part -</option>
                    {mekanikList.map((m) => (
                      <option key={m.id} value={m.id}>
                        👨‍🔧 {m.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Keluhan Pelanggan / Catatan</label>
                  <input
                    type="text"
                    className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200"
                    placeholder="Contoh: Bunyi di CVT, ganti oli mesin, rem decit"
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Step 2: Add Items */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 space-y-3">
              <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <span className="w-6 h-6 bg-violet-100 rounded-md flex items-center justify-center text-violet-600 text-xs font-bold">
                  2
                </span>
                Tambah Spare Part &amp; Jasa Service
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Spare Part Search */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1.5">🔩 Spare Part / Oli / Aksesoris</p>
                  <SearchDropdown<SparePart>
                    placeholder="Ketik nama part / kode..."
                    onSelect={addSparePart}
                    fetchUrl={(q) => `/api/spare-part?search=${encodeURIComponent(q)}&limit=8`}
                    renderItem={(p) => (
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-900">{p.nama}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{p.kode}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900 text-xs">{formatRupiah(p.hargaJual)}</p>
                          <span
                            className={`text-[10px] px-1.5 py-0.2 rounded font-medium ${
                              p.stok <= 0
                                ? "bg-red-100 text-red-700"
                                : p.stok <= 5
                                ? "bg-amber-100 text-amber-700"
                                : "text-slate-500"
                            }`}
                          >
                            Stok: {p.stok} {p.satuan}
                          </span>
                        </div>
                      </div>
                    )}
                  />
                </div>

                {/* Jasa Service Search */}
                <div>
                  <p className="text-xs font-semibold text-slate-600 mb-1.5">🔧 Jasa Service &amp; Pengerjaan</p>
                  <SearchDropdown<JasaService>
                    placeholder="Ketik nama jasa (tune up, ganti oli)..."
                    onSelect={addJasa}
                    fetchUrl={(q) => `/api/jasa-service?search=${encodeURIComponent(q)}`}
                    renderItem={(j) => (
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-900">{j.nama}</p>
                          <p className="text-[10px] text-slate-400 font-mono">{j.kode}</p>
                        </div>
                        <span className="font-bold text-violet-700 text-xs">{formatRupiah(j.harga)}</span>
                      </div>
                    )}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* ===== Right: Keranjang & Pembayaran ===== */}
          <div className="xl:col-span-2 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden sticky top-4">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  🛒 Keranjang Nota
                  {cart.length > 0 && (
                    <span className="bg-violet-600 text-white text-xs rounded-full px-2 py-0.5 font-bold">
                      {cart.length}
                    </span>
                  )}
                </h2>
                {cart.length > 0 && (
                  <button
                    onClick={() => {
                      if (confirm("Kosongkan keranjang?")) setCart([]);
                    }}
                    className="text-xs font-medium text-red-500 hover:text-red-700"
                  >
                    Kosongkan
                  </button>
                )}
              </div>

              {/* Cart items list */}
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <div className="p-8 text-center text-sm text-slate-400">
                    <div className="text-3xl mb-1">🛒</div>
                    <p className="font-medium">Keranjang masih kosong</p>
                    <p className="text-xs text-slate-400 mt-1">Cari spare part atau jasa di sebelah kiri</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.id} className="p-3.5 space-y-1.5 hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <Badge variant={item.tipe === "SPARE_PART" ? "info" : "secondary"}>
                              {item.tipe === "SPARE_PART" ? "Part" : "Jasa"}
                            </Badge>
                            <p className="text-xs font-bold text-slate-900 truncate">{item.nama}</p>
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5">
                            {formatRupiah(item.hargaSatuan)}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 flex-shrink-0">
                          <button
                            onClick={() => updateQty(item.id, item.jumlah - 1)}
                            className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-sm font-bold transition-colors"
                          >
                            −
                          </button>
                          <span className="w-7 text-center text-xs font-bold text-slate-800">
                            {item.jumlah}
                          </span>
                          <button
                            onClick={() => updateQty(item.id, item.jumlah + 1)}
                            className="w-6 h-6 flex items-center justify-center bg-slate-100 hover:bg-slate-200 rounded text-slate-700 text-sm font-bold transition-colors"
                          >
                            +
                          </button>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="w-6 h-6 flex items-center justify-center hover:bg-red-50 rounded text-slate-300 hover:text-red-500 transition-colors ml-1"
                            title="Hapus item"
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-xs pt-1">
                        <div className="flex items-center gap-1 text-[11px] text-slate-500">
                          <span>Diskon:</span>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={item.diskon}
                            onChange={(e) => {
                              const disc = Math.min(100, Math.max(0, parseFloat(e.target.value) || 0));
                              setCart((c) =>
                                c.map((i) =>
                                  i.id === item.id
                                    ? { ...i, diskon: disc, subtotal: calcSubtotal({ ...i, diskon: disc }) }
                                    : i
                                )
                              );
                            }}
                            className="w-12 text-right border border-slate-300 rounded px-1 py-0.5 text-[11px]"
                          />
                          <span>%</span>
                        </div>
                        <span className="font-bold text-slate-900">{formatRupiah(calcSubtotal(item))}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total Summary */}
              <div className="border-t border-slate-200 p-4 space-y-2 bg-slate-50/70">
                <div className="flex justify-between text-xs text-slate-600">
                  <span>Subtotal Item</span>
                  <span className="font-semibold">{formatRupiah(subtotalItems)}</span>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-slate-600">Diskon Global (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={diskonGlobal}
                    onChange={(e) => setDiskonGlobal(parseFloat(e.target.value) || 0)}
                    className="w-16 text-right text-xs border border-slate-300 rounded px-2 py-1 font-bold focus:outline-none focus:ring-1 focus:ring-violet-300"
                  />
                </div>

                {diskonGlobal > 0 && (
                  <div className="flex justify-between text-xs text-red-600 font-semibold">
                    <span>Potongan ({diskonGlobal}%)</span>
                    <span>-{formatRupiah(diskonRp)}</span>
                  </div>
                )}

                <div className="flex justify-between font-bold text-slate-900 pt-2 border-t border-slate-200">
                  <span className="text-sm">Total Tagihan</span>
                  <span className="text-lg text-violet-700">{formatRupiah(total)}</span>
                </div>
              </div>

              {/* Pay Button */}
              <div className="p-4 pt-1">
                <Button
                  className="w-full shadow-md"
                  size="lg"
                  disabled={cart.length === 0}
                  onClick={() => {
                    setDibayar(String(total));
                    setPayModalOpen(true);
                  }}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  }
                >
                  Proses Pembayaran ({formatRupiah(total)})
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Pembayaran */}
      <Modal isOpen={payModalOpen} onClose={() => setPayModalOpen(false)} title="Konfirmasi & Pembayaran" size="sm">
        <div className="p-5 space-y-4">
          <div className="bg-violet-50 rounded-2xl p-4 text-center border border-violet-100">
            <p className="text-xs text-violet-600 uppercase tracking-wider font-bold">Total Pembayaran</p>
            <p className="text-3xl font-extrabold text-violet-800 mt-1">{formatRupiah(total)}</p>
            {pelanggan && (
              <p className="text-xs text-slate-600 mt-1 font-medium">
                {pelanggan.nama} {kendaraan ? `• ${kendaraan.nomorPolisi}` : ""}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Pilih Cara Pembayaran</label>
            <div className="grid grid-cols-3 gap-2">
              {["TUNAI", "TRANSFER", "QRIS"].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMetodePembayaran(m)}
                  className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                    metodePembayaran === m
                      ? "border-violet-600 bg-violet-600 text-white shadow-sm"
                      : "border-slate-200 text-slate-600 hover:border-slate-300"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {metodePembayaran === "TUNAI" && (
            <div className="space-y-2">
              <Input
                label="Nominal Diterima dari Pelanggan"
                type="number"
                value={dibayar}
                onChange={(e) => setDibayar(e.target.value)}
                placeholder={String(total)}
              />

              {/* Quick Nominal Buttons */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setDibayar(String(total))}
                  className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-violet-100 text-slate-700 hover:text-violet-700 transition-colors"
                >
                  Uang Pas
                </button>
                {[50000, 100000, 200000, 500000].map((nom) => (
                  <button
                    key={nom}
                    type="button"
                    onClick={() => setDibayar(String(nom))}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-slate-100 hover:bg-violet-100 text-slate-700 hover:text-violet-700 transition-colors"
                  >
                    {formatRupiah(nom)}
                  </button>
                ))}
              </div>

              <div
                className={`flex justify-between items-center text-sm font-bold rounded-xl px-4 py-2.5 ${
                  kembalian > 0
                    ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                    : kurang > 0
                    ? "bg-red-50 text-red-600 border border-red-200"
                    : "bg-slate-50 text-slate-700"
                }`}
              >
                <span>{kurang > 0 ? "Kekurangan" : "Kembalian"}</span>
                <span className="text-base">{formatRupiah(kurang > 0 ? kurang : kembalian)}</span>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setPayModalOpen(false)}>
              Batal
            </Button>
            <Button
              className="flex-1 font-bold shadow-md"
              loading={submitting}
              onClick={handleBayar}
              disabled={metodePembayaran === "TUNAI" && dibayarNum < total}
            >
              ✓ Bayar &amp; Cetak
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Quick Pelanggan + Kendaraan */}
      <Modal
        isOpen={quickPelangganModal}
        onClose={() => setQuickPelangganModal(false)}
        title="Daftar Cepat Pelanggan & Kendaraan"
        size="md"
      >
        <form onSubmit={handleQuickAddPelanggan} className="p-5 space-y-3">
          <p className="text-xs text-slate-500">
            Daftarkan pelanggan dan kendaraannya langsung tanpa meninggalkan transaksi.
          </p>

          <Input
            label="Nama Lengkap Pelanggan"
            required
            value={quickNama}
            onChange={(e) => setQuickNama(e.target.value)}
            placeholder="Contoh: Pak Bambang"
          />

          <Input
            label="Nomor WhatsApp / HP"
            value={quickTelepon}
            onChange={(e) => setQuickTelepon(e.target.value)}
            placeholder="Contoh: 08123456789"
          />

          <div className="pt-2 border-t border-slate-100">
            <p className="text-xs font-bold text-slate-800 mb-2">Data Kendaraan (Opsional):</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <Input
                label="Nomor Polisi"
                value={quickNopol}
                onChange={(e) => setQuickNopol(e.target.value)}
                placeholder="L 1234 AB"
              />
              <Input
                label="Merek"
                value={quickMerek}
                onChange={(e) => setQuickMerek(e.target.value)}
                placeholder="Honda / Yamaha"
              />
              <Input
                label="Model / Tipe"
                value={quickModel}
                onChange={(e) => setQuickModel(e.target.value)}
                placeholder="Beat / Vario / NMax"
              />
            </div>
          </div>

          <div className="flex gap-2 pt-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setQuickPelangganModal(false)}>
              Batal
            </Button>
            <Button type="submit" loading={submitting} className="flex-1">
              Simpan &amp; Pilih
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Quick Kendaraan */}
      <Modal
        isOpen={quickKendaraanModal}
        onClose={() => setQuickKendaraanModal(false)}
        title={`Tambah Kendaraan untuk ${pelanggan?.nama}`}
        size="sm"
      >
        <form onSubmit={handleQuickAddKendaraan} className="p-5 space-y-3">
          <Input
            label="Nomor Polisi"
            required
            value={nopolBaru}
            onChange={(e) => setNopolBaru(e.target.value)}
            placeholder="Contoh: B 1234 XYZ"
          />
          <Input
            label="Merek"
            value={merekBaru}
            onChange={(e) => setMerekBaru(e.target.value)}
            placeholder="Contoh: Honda / Suzuki"
          />
          <Input
            label="Model"
            value={modelBaru}
            onChange={(e) => setModelBaru(e.target.value)}
            placeholder="Contoh: Scoopy / Satria"
          />

          <div className="flex gap-2 pt-3">
            <Button type="button" variant="outline" className="flex-1" onClick={() => setQuickKendaraanModal(false)}>
              Batal
            </Button>
            <Button type="submit" loading={submitting} className="flex-1">
              Simpan Kendaraan
            </Button>
          </div>
        </form>
      </Modal>

      {/* Modal Riwayat Servis Kendaraan */}
      <Modal
        isOpen={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        title={`Riwayat Servis ${kendaraan?.nomorPolisi}`}
        size="lg"
      >
        <div className="p-5 space-y-3">
          {kendaraan && (
            <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs">
              <div>
                <span className="font-bold text-slate-900 text-sm">{kendaraan.nomorPolisi}</span>
                <span className="text-slate-500 ml-2">
                  {kendaraan.merek} {kendaraan.model}
                </span>
              </div>
              <span className="text-slate-400">Pemilik: {pelanggan?.nama}</span>
            </div>
          )}

          {loadingHistory ? (
            <div className="p-8 text-center text-xs text-slate-400">Memuat riwayat servis...</div>
          ) : serviceHistory.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 italic">
              Belum ada catatan servis sebelumnya untuk kendaraan ini.
            </div>
          ) : (
            <div className="divide-y divide-slate-100 max-h-96 overflow-y-auto">
              {serviceHistory.map((item) => (
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
                        <span>• {d.nama} ({d.jumlah}x)</span>
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

      {/* Modal Held Carts (Transaksi Ditahan) */}
      <Modal
        isOpen={heldModalOpen}
        onClose={() => setHeldModalOpen(false)}
        title={`Daftar Transaksi Ditahan (${heldCarts.length})`}
        size="md"
      >
        <div className="p-5 space-y-3">
          <p className="text-xs text-slate-500">
            Pilih transaksi yang ingin dilanjutkan kembali ke keranjang kasir.
          </p>

          <div className="space-y-2 max-h-80 overflow-y-auto">
            {heldCarts.map((h) => {
              const holdTotal = h.cart.reduce((s, i) => s + calcSubtotal(i), 0);
              return (
                <div
                  key={h.id}
                  className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm hover:border-violet-300 transition-colors"
                >
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{h.label}</p>
                    <p className="text-[11px] text-slate-500">
                      {h.timestamp} • {h.cart.length} item • Total {formatRupiah(holdTotal)}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleRestoreCart(h)}
                      className="px-3 py-1.5 text-xs font-bold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors"
                    >
                      Buka
                    </button>
                    <button
                      onClick={() => handleDeleteHeld(h.id)}
                      className="p-1.5 text-slate-300 hover:text-red-600 rounded transition-colors"
                      title="Hapus draft"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </Modal>
    </AppShell>
  );
}
