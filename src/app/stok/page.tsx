"use client";

import React, { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button, Input, Badge, Modal } from "@/components/ui";
import { formatDateTime, formatRupiah } from "@/lib/utils";
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
  kategori?: { id: string; nama: string };
}

interface Supplier {
  id: string;
  nama: string;
  telepon?: string;
  email?: string;
  alamat?: string;
  aktif: boolean;
  _count?: { pembelian: number };
}

interface PembelianItem {
  id?: string;
  sparePartId: string;
  nama: string;
  jumlah: number;
  hargaBeli: number;
}

interface Pembelian {
  id: string;
  nomorPO: string;
  tanggal: string;
  status: string;
  total: number;
  catatan?: string;
  supplier?: { nama: string; telepon?: string };
  detail: Array<{
    id: string;
    jumlah: number;
    hargaBeli: number;
    subtotal: number;
    sparePart: { kode: string; nama: string; satuan: string };
  }>;
}

export default function StokPage() {
  const [activeTab, setActiveTab] = useState<"stok" | "pembelian" | "supplier">("stok");

  // Data states
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [pembelianList, setPembelianList] = useState<Pembelian[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchStok, setSearchStok] = useState("");
  const [filterStokStatus, setFilterStokStatus] = useState<"ALL" | "KRITIS" | "HABIS" | "AMAN">("ALL");

  // Modals
  const [opnameModalOpen, setOpnameModalOpen] = useState(false);
  const [selectedPartForOpname, setSelectedPartForOpname] = useState<SparePart | null>(null);
  const [opnameStokBaru, setOpnameStokBaru] = useState("");
  const [opnameCatatan, setOpnameCatatan] = useState("");

  const [poModalOpen, setPoModalOpen] = useState(false);
  const [poSupplierId, setPoSupplierId] = useState("");
  const [poStatus, setPoStatus] = useState("SELESAI");
  const [poCatatan, setPoCatatan] = useState("");
  const [poItems, setPoItems] = useState<PembelianItem[]>([]);
  const [selectedPartToAdd, setSelectedPartToAdd] = useState("");
  const [partAddQty, setPartAddQty] = useState("1");
  const [partAddPrice, setPartAddPrice] = useState("");

  const [supplierModalOpen, setSupplierModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [supplierForm, setSupplierForm] = useState({ nama: "", telepon: "", email: "", alamat: "" });

  const [submitting, setSubmitting] = useState(false);

  // Fetch initial data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [spRes, poRes, supRes] = await Promise.all([
        fetch("/api/spare-part?limit=100"),
        fetch("/api/pembelian?limit=50"),
        fetch("/api/supplier"),
      ]);

      if (spRes.ok) {
        const json = await spRes.json();
        setSpareParts(json.data ?? []);
      }
      if (poRes.ok) {
        const json = await poRes.json();
        setPembelianList(json.data ?? []);
      }
      if (supRes.ok) {
        setSuppliers(await supRes.json());
      }
    } catch {
      toast.error("Gagal memuat data stok");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculations for stats
  const totalItemCount = spareParts.length;
  const stokHabisCount = spareParts.filter((s) => s.stok <= 0).length;
  const stokKritisCount = spareParts.filter((s) => s.stok > 0 && s.stok <= s.stokMinimum).length;
  const totalNilaiAset = spareParts.reduce((acc, s) => acc + s.stok * s.hargaBeli, 0);

  // Filtered spare parts
  const filteredParts = spareParts.filter((s) => {
    const matchSearch =
      s.nama.toLowerCase().includes(searchStok.toLowerCase()) ||
      s.kode.toLowerCase().includes(searchStok.toLowerCase()) ||
      (s.kategori?.nama && s.kategori.nama.toLowerCase().includes(searchStok.toLowerCase()));

    if (!matchSearch) return false;

    if (filterStokStatus === "HABIS") return s.stok <= 0;
    if (filterStokStatus === "KRITIS") return s.stok > 0 && s.stok <= s.stokMinimum;
    if (filterStokStatus === "AMAN") return s.stok > s.stokMinimum;
    return true;
  });

  // Handle Stok Opname
  const handleOpenOpname = (sp: SparePart) => {
    setSelectedPartForOpname(sp);
    setOpnameStokBaru(String(sp.stok));
    setOpnameCatatan("");
    setOpnameModalOpen(true);
  };

  const handleSaveOpname = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartForOpname) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/spare-part/stok-opname", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sparePartId: selectedPartForOpname.id,
          stokBaru: parseInt(opnameStokBaru) || 0,
          catatan: opnameCatatan,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success(`Stok ${selectedPartForOpname.nama} berhasil disesuaikan!`);
      setOpnameModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal menyesuaikan stok");
    } finally {
      setSubmitting(false);
    }
  };

  // Handle PO Item Add
  const handleAddPoItem = () => {
    if (!selectedPartToAdd) {
      toast.error("Pilih spare part terlebih dahulu");
      return;
    }
    const part = spareParts.find((s) => s.id === selectedPartToAdd);
    if (!part) return;

    const qty = parseInt(partAddQty) || 1;
    const price = parseFloat(partAddPrice) || part.hargaBeli;

    const existingIdx = poItems.findIndex((i) => i.sparePartId === part.id);
    if (existingIdx >= 0) {
      const updated = [...poItems];
      updated[existingIdx].jumlah += qty;
      updated[existingIdx].hargaBeli = price;
      setPoItems(updated);
    } else {
      setPoItems([
        ...poItems,
        {
          sparePartId: part.id,
          nama: part.nama,
          jumlah: qty,
          hargaBeli: price,
        },
      ]);
    }

    setSelectedPartToAdd("");
    setPartAddQty("1");
    setPartAddPrice("");
  };

  const handleRemovePoItem = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const handleSavePO = async (e: React.FormEvent) => {
    e.preventDefault();
    if (poItems.length === 0) {
      toast.error("Tambahkan minimal 1 spare part");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/pembelian", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: poSupplierId || undefined,
          status: poStatus,
          catatan: poCatatan,
          items: poItems,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      toast.success("Pembelian/Restock berhasil dibuat!");
      setPoModalOpen(false);
      setPoItems([]);
      setPoCatatan("");
      setPoSupplierId("");
      fetchData();
    } catch (err: unknown) {
      toast.error((err as Error).message || "Gagal membuat PO");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePoStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/pembelian/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Gagal memperbarui status PO");
      toast.success(`Status PO diperbarui ke ${status}`);
      fetchData();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    }
  };

  // Supplier CRUD
  const handleOpenAddSupplier = () => {
    setEditingSupplier(null);
    setSupplierForm({ nama: "", telepon: "", email: "", alamat: "" });
    setSupplierModalOpen(true);
  };

  const handleOpenEditSupplier = (sup: Supplier) => {
    setEditingSupplier(sup);
    setSupplierForm({
      nama: sup.nama,
      telepon: sup.telepon || "",
      email: sup.email || "",
      alamat: sup.alamat || "",
    });
    setSupplierModalOpen(true);
  };

  const handleSaveSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierForm.nama.trim()) {
      toast.error("Nama supplier wajib diisi");
      return;
    }

    setSubmitting(true);
    try {
      const url = editingSupplier ? `/api/supplier/${editingSupplier.id}` : "/api/supplier";
      const method = editingSupplier ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(supplierForm),
      });

      if (!res.ok) throw new Error("Gagal menyimpan supplier");
      toast.success(editingSupplier ? "Supplier diperbarui" : "Supplier berhasil ditambahkan");
      setSupplierModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      toast.error((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AppShell title="Stok & Pembelian">
      <div className="space-y-6">
        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-900">Manajemen Stok &amp; Pembelian</h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Monitoring stok opname, inventaris spare part, dan pengadaan barang dari supplier
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleOpenAddSupplier}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              }
            >
              + Supplier Baru
            </Button>
            <Button
              onClick={() => {
                setPoItems([]);
                setPoSupplierId(suppliers[0]?.id || "");
                setPoModalOpen(true);
              }}
              leftIcon={
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              }
            >
              + Buat Restock / PO
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="stat-card">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Spare Part</p>
            <p className="text-2xl font-bold text-slate-900 mt-1">{totalItemCount}</p>
            <p className="text-xs text-slate-400 mt-0.5">Item terdaftar</p>
          </div>
          <div className="stat-card border-amber-200 bg-amber-50/40">
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Stok Kritis</p>
            <p className="text-2xl font-bold text-amber-800 mt-1">{stokKritisCount}</p>
            <p className="text-xs text-amber-600 mt-0.5">Mendekati batas minimum</p>
          </div>
          <div className="stat-card border-red-200 bg-red-50/40">
            <p className="text-xs font-semibold text-red-700 uppercase tracking-wider">Stok Habis</p>
            <p className="text-2xl font-bold text-red-800 mt-1">{stokHabisCount}</p>
            <p className="text-xs text-red-600 mt-0.5">Perlu segera di-restock</p>
          </div>
          <div className="stat-card">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Nilai Aset Stok</p>
            <p className="text-2xl font-bold text-violet-700 mt-1">{formatRupiah(totalNilaiAset)}</p>
            <p className="text-xs text-slate-400 mt-0.5">Modal inventaris tersimpan</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-6">
          <button
            onClick={() => setActiveTab("stok")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "stok"
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            📦 Monitoring &amp; Audit Stok
            {(stokHabisCount > 0 || stokKritisCount > 0) && (
              <span className="px-2 py-0.5 text-xs rounded-full bg-red-100 text-red-700 font-bold">
                {stokHabisCount + stokKritisCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab("pembelian")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "pembelian"
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            🚚 Riwayat Pembelian &amp; PO
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 font-medium">
              {pembelianList.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab("supplier")}
            className={`pb-3 text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "supplier"
                ? "border-violet-600 text-violet-700"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            🏢 Data Supplier
            <span className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600 font-medium">
              {suppliers.length}
            </span>
          </button>
        </div>

        {/* TAB 1: STOK MONITORING & AUDIT */}
        {activeTab === "stok" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="max-w-xs flex-1">
                <Input
                  placeholder="Cari nama part, kode, atau kategori..."
                  value={searchStok}
                  onChange={(e) => setSearchStok(e.target.value)}
                  leftIcon={
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  }
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                {(
                  [
                    { key: "ALL", label: "Semua" },
                    { key: "HABIS", label: `Habis (${stokHabisCount})` },
                    { key: "KRITIS", label: `Kritis (${stokKritisCount})` },
                    { key: "AMAN", label: "Aman" },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setFilterStokStatus(f.key)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                      filterStokStatus === f.key
                        ? "bg-violet-600 text-white border-violet-600 shadow-sm"
                        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                {loading ? (
                  <div className="p-10 text-center text-sm text-slate-400">Memuat stok...</div>
                ) : filteredParts.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-4xl mb-2">🔍</div>
                    <p className="text-sm text-slate-500 font-medium">Tidak ada spare part yang sesuai filter</p>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Kode</th>
                        <th>Nama Spare Part</th>
                        <th>Kategori</th>
                        <th className="text-right">Harga Beli</th>
                        <th className="text-right">Harga Jual</th>
                        <th className="text-center">Stok</th>
                        <th className="text-center">Min.</th>
                        <th>Status</th>
                        <th className="text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredParts.map((sp) => {
                        const isHabis = sp.stok <= 0;
                        const isKritis = sp.stok > 0 && sp.stok <= sp.stokMinimum;

                        return (
                          <tr key={sp.id} className={isHabis ? "bg-red-50/30" : isKritis ? "bg-amber-50/20" : ""}>
                            <td className="font-mono text-xs font-semibold text-slate-500">{sp.kode}</td>
                            <td>
                              <p className="font-semibold text-slate-900">{sp.nama}</p>
                              {sp.lokasi && (
                                <p className="text-xs text-slate-400">Lokasi rak: {sp.lokasi}</p>
                              )}
                            </td>
                            <td>
                              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                                {sp.kategori?.nama ?? "Umum"}
                              </span>
                            </td>
                            <td className="text-right font-medium text-slate-600">{formatRupiah(sp.hargaBeli)}</td>
                            <td className="text-right font-semibold text-slate-900">{formatRupiah(sp.hargaJual)}</td>
                            <td className="text-center font-bold text-sm">
                              <span
                                className={
                                  isHabis ? "text-red-600" : isKritis ? "text-amber-600" : "text-emerald-700"
                                }
                              >
                                {sp.stok} {sp.satuan}
                              </span>
                            </td>
                            <td className="text-center text-xs text-slate-400">{sp.stokMinimum}</td>
                            <td>
                              {isHabis ? (
                                <Badge variant="danger">Habis</Badge>
                              ) : isKritis ? (
                                <Badge variant="warning">Kritis</Badge>
                              ) : (
                                <Badge variant="success">Aman</Badge>
                              )}
                            </td>
                            <td>
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenOpname(sp)}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-violet-100 text-slate-700 hover:text-violet-700 transition-colors"
                                  title="Sesuaikan stok fisik"
                                >
                                  ⚖️ Opname
                                </button>
                                <button
                                  onClick={() => {
                                    setPoItems([
                                      {
                                        sparePartId: sp.id,
                                        nama: sp.nama,
                                        jumlah: Math.max(10, sp.stokMinimum * 2),
                                        hargaBeli: sp.hargaBeli,
                                      },
                                    ]);
                                    setPoSupplierId(suppliers[0]?.id || "");
                                    setPoModalOpen(true);
                                  }}
                                  className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-violet-50 hover:bg-violet-600 text-violet-700 hover:text-white transition-colors"
                                  title="Pesan restock barang"
                                >
                                  + Restock
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: PEMBELIAN & PO */}
        {activeTab === "pembelian" && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                {pembelianList.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="text-4xl mb-2">📑</div>
                    <p className="text-sm text-slate-500 font-medium">Belum ada riwayat pembelian / restock</p>
                    <Button
                      onClick={() => {
                        setPoItems([]);
                        setPoModalOpen(true);
                      }}
                      className="mt-3"
                    >
                      Buat Pembelian Pertama
                    </Button>
                  </div>
                ) : (
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Nomor PO</th>
                        <th>Tanggal</th>
                        <th>Supplier</th>
                        <th>Item Barang</th>
                        <th className="text-right">Total Pembelian</th>
                        <th>Status</th>
                        <th className="text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pembelianList.map((po) => (
                        <tr key={po.id}>
                          <td className="font-mono text-xs font-bold text-violet-700">{po.nomorPO}</td>
                          <td className="text-xs text-slate-500">{formatDateTime(po.tanggal)}</td>
                          <td>
                            <p className="font-medium text-slate-900">{po.supplier?.nama ?? "Pembelian Langsung"}</p>
                            {po.supplier?.telepon && (
                              <p className="text-xs text-slate-400">{po.supplier.telepon}</p>
                            )}
                          </td>
                          <td>
                            <div className="text-xs text-slate-600">
                              {po.detail.map((d) => (
                                <span key={d.id} className="inline-block bg-slate-100 rounded px-1.5 py-0.5 mr-1 mb-1">
                                  {d.sparePart.nama} ({d.jumlah} {d.sparePart.satuan})
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="text-right font-bold text-slate-900">{formatRupiah(po.total)}</td>
                          <td>
                            <Badge
                              variant={
                                po.status === "SELESAI"
                                  ? "success"
                                  : po.status === "PENDING"
                                  ? "warning"
                                  : "danger"
                              }
                            >
                              {po.status === "SELESAI"
                                ? "Selesai (Masuk Stok)"
                                : po.status === "PENDING"
                                ? "Pending (Menunggu)"
                                : "Batal"}
                            </Badge>
                          </td>
                          <td>
                            <div className="flex justify-end gap-1.5">
                              {po.status === "PENDING" && (
                                <button
                                  onClick={() => handleUpdatePoStatus(po.id, "SELESAI")}
                                  className="px-2.5 py-1 text-xs font-semibold rounded bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white transition-colors"
                                >
                                  ✓ Terima Barang
                                </button>
                              )}
                              {po.status !== "BATAL" && (
                                <button
                                  onClick={() => {
                                    if (confirm(`Batalkan PO ${po.nomorPO}? Stok yang sudah masuk akan dikurangi kembali.`)) {
                                      handleUpdatePoStatus(po.id, "BATAL");
                                    }
                                  }}
                                  className="px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50 rounded transition-colors"
                                >
                                  Batalkan
                                </button>
                              )}
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
        )}

        {/* TAB 3: SUPPLIER */}
        {activeTab === "supplier" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {suppliers.map((sup) => (
                <div key={sup.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900">{sup.nama}</h3>
                      {sup.alamat && <p className="text-xs text-slate-500 mt-1">📍 {sup.alamat}</p>}
                      {sup.telepon && <p className="text-xs text-slate-600 mt-1 font-medium">📞 {sup.telepon}</p>}
                      {sup.email && <p className="text-xs text-slate-500 mt-0.5">✉️ {sup.email}</p>}
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-semibold">
                      {sup._count?.pembelian ?? 0} PO
                    </span>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => handleOpenEditSupplier(sup)}
                      className="text-xs font-medium text-slate-600 hover:text-violet-700 transition-colors"
                    >
                      ✏️ Edit Data
                    </button>
                    <button
                      onClick={() => {
                        setPoItems([]);
                        setPoSupplierId(sup.id);
                        setPoModalOpen(true);
                      }}
                      className="text-xs font-semibold text-violet-700 hover:text-violet-900 transition-colors"
                    >
                      + Buat PO ke Supplier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Modal Stok Opname */}
        <Modal
          isOpen={opnameModalOpen}
          onClose={() => setOpnameModalOpen(false)}
          title="Koreksi Stok (Stok Opname)"
          size="sm"
        >
          {selectedPartForOpname && (
            <form onSubmit={handleSaveOpname} className="p-5 space-y-4">
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-xs text-slate-400 font-mono">{selectedPartForOpname.kode}</p>
                <p className="font-bold text-slate-900 text-sm mt-0.5">{selectedPartForOpname.nama}</p>
                <p className="text-xs text-slate-600 mt-1">
                  Stok di Sistem: <strong className="text-slate-900">{selectedPartForOpname.stok} {selectedPartForOpname.satuan}</strong>
                </p>
              </div>

              <div>
                <Input
                  label="Jumlah Fisik Sebenarnya"
                  type="number"
                  min="0"
                  required
                  value={opnameStokBaru}
                  onChange={(e) => setOpnameStokBaru(e.target.value)}
                  placeholder="Masukkan jumlah stok riil"
                />
                {opnameStokBaru !== "" && (
                  <p className="text-xs mt-1.5 font-medium">
                    Selisih:{" "}
                    <span
                      className={
                        parseInt(opnameStokBaru) - selectedPartForOpname.stok >= 0
                          ? "text-emerald-600 font-bold"
                          : "text-red-600 font-bold"
                      }
                    >
                      {parseInt(opnameStokBaru) - selectedPartForOpname.stok >= 0 ? "+" : ""}
                      {parseInt(opnameStokBaru) - selectedPartForOpname.stok} {selectedPartForOpname.satuan}
                    </span>
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Alasan Penyesuaian</label>
                <textarea
                  className="w-full rounded-lg border border-slate-300 text-sm px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-violet-200 focus:border-violet-400"
                  rows={2}
                  value={opnameCatatan}
                  onChange={(e) => setOpnameCatatan(e.target.value)}
                  placeholder="Contoh: Audit fisik bulanan, barang rusak, dsb"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setOpnameModalOpen(false)}>
                  Batal
                </Button>
                <Button type="submit" loading={submitting} className="flex-1">
                  Simpan Penyesuaian
                </Button>
              </div>
            </form>
          )}
        </Modal>

        {/* Modal Buat Restock / PO */}
        <Modal
          isOpen={poModalOpen}
          onClose={() => setPoModalOpen(false)}
          title="Pengadaan Barang (Purchase Order / Restock)"
          size="lg"
        >
          <form onSubmit={handleSavePO} className="p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Pilih Supplier</label>
                <select
                  value={poSupplierId}
                  onChange={(e) => setPoSupplierId(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200"
                >
                  <option value="">- Pembelian Umum / Tanpa Supplier -</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Status Pengadaan</label>
                <select
                  value={poStatus}
                  onChange={(e) => setPoStatus(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200"
                >
                  <option value="SELESAI">Selesai (Barang Sudah Datang &amp; Stok Masuk)</option>
                  <option value="PENDING">Pending (Pemesanan Masih Berjalan)</option>
                </select>
              </div>
            </div>

            {/* Add Item form */}
            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 space-y-2">
              <p className="text-xs font-semibold text-slate-700">Tambah Item Spare Part ke PO:</p>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-end">
                <div className="sm:col-span-6">
                  <select
                    value={selectedPartToAdd}
                    onChange={(e) => {
                      setSelectedPartToAdd(e.target.value);
                      const p = spareParts.find((s) => s.id === e.target.value);
                      if (p) setPartAddPrice(String(p.hargaBeli));
                    }}
                    className="w-full rounded-lg border border-slate-300 text-xs px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-violet-200"
                  >
                    <option value="">- Pilih Spare Part -</option>
                    {spareParts.map((sp) => (
                      <option key={sp.id} value={sp.id}>
                        {sp.nama} (Stok: {sp.stok})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <input
                    type="number"
                    min="1"
                    placeholder="Qty"
                    value={partAddQty}
                    onChange={(e) => setPartAddQty(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 text-xs px-2.5 py-2"
                  />
                </div>
                <div className="sm:col-span-3">
                  <input
                    type="number"
                    min="0"
                    placeholder="Harga Beli Satuan"
                    value={partAddPrice}
                    onChange={(e) => setPartAddPrice(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 text-xs px-2.5 py-2"
                  />
                </div>
                <div className="sm:col-span-1">
                  <button
                    type="button"
                    onClick={handleAddPoItem}
                    className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-lg py-2 text-xs font-bold transition-colors"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {/* List items added */}
            <div>
              <p className="text-xs font-semibold text-slate-700 mb-2">Item yang Dibeli ({poItems.length}):</p>
              {poItems.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-white p-3 rounded-lg border border-dashed border-slate-200 text-center">
                  Belum ada item ditambahkan
                </p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                  {poItems.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2.5 bg-white text-xs">
                      <div>
                        <p className="font-semibold text-slate-900">{item.nama}</p>
                        <p className="text-slate-500">
                          {item.jumlah} × {formatRupiah(item.hargaBeli)}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">
                          {formatRupiah(item.jumlah * item.hargaBeli)}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePoItem(idx)}
                          className="text-red-500 hover:text-red-700 font-bold"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Total */}
            <div className="flex justify-between items-center bg-violet-50 p-3 rounded-xl border border-violet-200">
              <span className="text-xs font-semibold text-slate-700">Total Pengeluaran PO:</span>
              <span className="text-base font-bold text-violet-800">
                {formatRupiah(poItems.reduce((acc, i) => acc + i.jumlah * i.hargaBeli, 0))}
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan PO</label>
              <textarea
                className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 resize-none"
                rows={2}
                value={poCatatan}
                onChange={(e) => setPoCatatan(e.target.value)}
                placeholder="Catatan faktur pengiriman, nomor resi supplier, dll"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setPoModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" loading={submitting} disabled={poItems.length === 0} className="flex-1">
                ✓ Simpan Pembelian
              </Button>
            </div>
          </form>
        </Modal>

        {/* Modal Tambah/Edit Supplier */}
        <Modal
          isOpen={supplierModalOpen}
          onClose={() => setSupplierModalOpen(false)}
          title={editingSupplier ? "Edit Data Supplier" : "Tambah Supplier Baru"}
          size="sm"
        >
          <form onSubmit={handleSaveSupplier} className="p-5 space-y-3">
            <Input
              label="Nama Perusahaan / Supplier"
              required
              value={supplierForm.nama}
              onChange={(e) => setSupplierForm({ ...supplierForm, nama: e.target.value })}
              placeholder="Contoh: PT Astra Honda Motor"
            />
            <Input
              label="Nomor Telepon / WhatsApp"
              value={supplierForm.telepon}
              onChange={(e) => setSupplierForm({ ...supplierForm, telepon: e.target.value })}
              placeholder="Contoh: 08123456789"
            />
            <Input
              label="Email"
              type="email"
              value={supplierForm.email}
              onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
              placeholder="supplier@email.com"
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Alamat</label>
              <textarea
                className="w-full rounded-lg border border-slate-300 text-xs px-3 py-2 resize-none"
                rows={2}
                value={supplierForm.alamat}
                onChange={(e) => setSupplierForm({ ...supplierForm, alamat: e.target.value })}
                placeholder="Alamat distributor / gudang..."
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setSupplierModalOpen(false)}>
                Batal
              </Button>
              <Button type="submit" loading={submitting} className="flex-1">
                Simpan Supplier
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </AppShell>
  );
}
