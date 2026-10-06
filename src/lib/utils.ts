import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format number as Indonesian Rupiah
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Format date to Indonesian locale
 */
export function formatDate(date: Date | string, opts?: Intl.DateTimeFormatOptions): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("id-ID", opts ?? { day: "numeric", month: "long", year: "numeric" });
}

/**
 * Format datetime to Indonesian locale
 */
export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Generate invoice number e.g. INV-20241001-001
 */
export function generateInvoiceNumber(seq: number): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const s = String(seq).padStart(3, "0");
  return `INV-${y}${m}${d}-${s}`;
}

/**
 * Truncate text
 */
export function truncate(text: string, max = 30): string {
  if (text.length <= max) return text;
  return text.slice(0, max) + "…";
}

/**
 * Safe parse number from string
 */
export function parseNumber(val: string): number {
  const n = parseFloat(val.replace(/[^0-9.-]/g, ""));
  return isNaN(n) ? 0 : n;
}

/**
 * Status badge variant helper
 */
export function getStatusVariant(status: string): "success" | "warning" | "danger" | "info" | "default" {
  const map: Record<string, "success" | "warning" | "danger" | "info" | "default"> = {
    SELESAI: "success",
    LUNAS: "success",
    AKTIF: "success",
    PROSES: "info",
    PENDING: "warning",
    ANTRI: "warning",
    BATAL: "danger",
    HUTANG: "danger",
  };
  return map[status?.toUpperCase()] ?? "default";
}
