"use client";

import React, { useEffect, useRef, useState } from "react";
import { Sidebar } from "./Sidebar";
import Link from "next/link";
import { formatRupiah } from "@/lib/utils";

interface HeaderProps {
  onMenuClick: () => void;
  title?: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick, title }) => {
  const [notifOpen, setNotifOpen] = useState(false);
  const [stokKritis, setStokKritis] = useState<Array<{ id: string; nama: string; stok: number; satuan: string; stokMinimum: number }>>([]);
  const [transaksiPendingCount, setTransaksiPendingCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fetch notification data
    const fetchAlerts = async () => {
      try {
        const [spRes, txRes] = await Promise.all([
          fetch("/api/spare-part?stokKritis=true&limit=10"),
          fetch("/api/transaksi?status=ANTRI&limit=1"),
        ]);
        if (spRes.ok) {
          const spJson = await spRes.json();
          setStokKritis(spJson.data ?? []);
        }
        if (txRes.ok) {
          const txJson = await txRes.json();
          setTransaksiPendingCount(txJson.total ?? 0);
        }
      } catch {
        /* skip */
      }
    };

    fetchAlerts();
  }, []);

  // Close popup when clicked outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const totalNotifs = stokKritis.length + (transaksiPendingCount > 0 ? 1 : 0);

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 lg:px-6 flex-shrink-0 sticky top-0 z-20">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
          aria-label="Toggle menu"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        {title && <h1 className="text-base font-semibold text-slate-800 hidden sm:block">{title}</h1>}
      </div>

      <div className="flex items-center gap-2.5">
        {/* Quick Shortcut to Kasir */}
        <Link
          href="/kasir"
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors"
        >
          <span>⚡ Buka Kasir</span>
        </Link>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            title="Pemberitahuan Sistem"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {totalNotifs > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
            )}
          </button>

          {/* Notification Dropdown Panel */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in duration-150">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <p className="text-xs font-bold text-slate-800">Pemberitahuan Bengkel</p>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">
                  {totalNotifs} Perhatian
                </span>
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {totalNotifs === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">
                    <p className="text-xl mb-1">🎉</p>
                    Semua stok aman &amp; tidak ada antrian menumpuk.
                  </div>
                ) : (
                  <>
                    {transaksiPendingCount > 0 && (
                      <Link
                        href="/transaksi"
                        onClick={() => setNotifOpen(false)}
                        className="block p-3 hover:bg-amber-50/60 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-amber-500 text-base">⏳</span>
                          <div>
                            <p className="text-xs font-bold text-slate-800">
                              {transaksiPendingCount} Transaksi Menunggu
                            </p>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              Ada unit yang sedang mengantri untuk dikerjakan.
                            </p>
                          </div>
                        </div>
                      </Link>
                    )}

                    {stokKritis.map((item) => (
                      <Link
                        key={item.id}
                        href="/stok"
                        onClick={() => setNotifOpen(false)}
                        className="block p-3 hover:bg-red-50/60 transition-colors"
                      >
                        <div className="flex items-start gap-2">
                          <span className="text-red-500 text-base">⚠️</span>
                          <div>
                            <p className="text-xs font-bold text-slate-800">{item.nama}</p>
                            <p className="text-[11px] text-red-600 font-semibold mt-0.5">
                              {item.stok <= 0 ? "Stok Habis (0)" : `Sisa ${item.stok} ${item.satuan} (Min: ${item.stokMinimum})`}
                            </p>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </>
                )}
              </div>

              <div className="p-2.5 border-t border-slate-100 bg-slate-50 text-center">
                <Link
                  href="/stok"
                  onClick={() => setNotifOpen(false)}
                  className="text-xs font-bold text-violet-700 hover:underline"
                >
                  Kelola Stok &amp; Restock →
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Date & Time */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-xs text-slate-600 font-medium">
            {new Date().toLocaleDateString("id-ID", {
              weekday: "short",
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </span>
        </div>
      </div>
    </header>
  );
};

interface AppShellProps {
  children: React.ReactNode;
  title?: string;
}

export const AppShell: React.FC<AppShellProps> = ({ children, title }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 lg:ml-64">
        <Header onMenuClick={() => setSidebarOpen(true)} title={title} />
        <main className="flex-1 overflow-y-auto">
          <div className="p-4 lg:p-6 max-w-screen-2xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
};
