import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate, formatDateTime, formatRupiah } from "@/lib/utils";

export default async function InvoicePage({ params }: { params: { id: string } }) {
  const tx = await prisma.transaksi.findUnique({
    where: { id: params.id },
    include: {
      pelanggan: true,
      kendaraan: true,
      kasir: { select: { nama: true } },
      detail: {
        include: {
          sparePart: { select: { kode: true, satuan: true } },
          jasaService: { select: { kode: true } },
          mekanik: { select: { nama: true } },
        },
      },
    },
  });

  if (!tx) notFound();

  const setting = await prisma.pengaturan.findMany();
  const cfg = Object.fromEntries(setting.map(s => [s.kunci, s.nilai]));

  return (
    <html lang="id">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Invoice {tx.nomorInvoice}</title>
        <style>{`
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Courier New', monospace; font-size: 12px; color: #000; background: #fff; }
          .container { max-width: 400px; margin: 0 auto; padding: 16px; }
          .center { text-align: center; }
          .bold { font-weight: bold; }
          .divider { border-top: 1px dashed #000; margin: 8px 0; }
          .row { display: flex; justify-content: space-between; margin: 3px 0; }
          .table-header { display: flex; justify-content: space-between; font-weight: bold; border-bottom: 1px solid #000; padding-bottom: 4px; margin-bottom: 4px; }
          .item-name { flex: 1; }
          .item-qty { width: 30px; text-align: center; }
          .item-price { width: 80px; text-align: right; }
          .item-subtotal { width: 80px; text-align: right; }
          .total-section { border-top: 1px dashed #000; margin-top: 8px; padding-top: 8px; }
          .grand-total { font-size: 16px; font-weight: bold; }
          .footer { text-align: center; margin-top: 16px; font-size: 11px; }
          @media print {
            body { print-color-adjust: exact; }
            .no-print { display: none; }
            @page { margin: 0; size: 80mm auto; }
          }
        `}</style>
      </head>
      <body>
        <div className="container">
          {/* Header */}
          <div className="center" style={{ marginBottom: "12px" }}>
            <div className="bold" style={{ fontSize: "16px" }}>{cfg.nama_bengkel ?? "Bengkel Motor"}</div>
            <div>{cfg.alamat_bengkel}</div>
            <div>Telp: {cfg.telepon_bengkel}</div>
            <div className="divider" />
            <div className="bold" style={{ fontSize: "14px" }}>INVOICE SERVICE</div>
            <div>{tx.nomorInvoice}</div>
            <div style={{ fontSize: "11px", color: "#666" }}>{formatDateTime(tx.tanggal)}</div>
          </div>

          {/* Customer info */}
          <div className="divider" />
          <div>
            <div className="row"><span>Pelanggan</span><span className="bold">{tx.pelanggan?.nama ?? "Umum"}</span></div>
            {tx.pelanggan?.telepon && <div className="row"><span>Telepon</span><span>{tx.pelanggan.telepon}</span></div>}
            {tx.kendaraan && (
              <>
                <div className="row"><span>Kendaraan</span><span className="bold">{tx.kendaraan.nomorPolisi}</span></div>
                <div className="row"><span></span><span>{tx.kendaraan.merek} {tx.kendaraan.model}</span></div>
              </>
            )}
            {tx.kasir && <div className="row"><span>Kasir</span><span>{tx.kasir.nama}</span></div>}
          </div>
          {tx.catatanKeluhan && (
            <div style={{ marginTop: "6px", fontStyle: "italic", fontSize: "11px" }}>
              Keluhan: {tx.catatanKeluhan}
            </div>
          )}

          {/* Items */}
          <div className="divider" />
          <div className="table-header">
            <span className="item-name">Item</span>
            <span className="item-qty">Qty</span>
            <span className="item-price">Harga</span>
            <span className="item-subtotal">Total</span>
          </div>
          {tx.detail.map((d, i) => (
            <div key={d.id} style={{ marginBottom: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span className="item-name bold">{d.nama}</span>
                <span className="item-qty">{d.jumlah}</span>
                <span className="item-price">{formatRupiah(d.hargaSatuan)}</span>
                <span className="item-subtotal">{formatRupiah(d.subtotal)}</span>
              </div>
              {d.mekanik && <div style={{ fontSize: "11px", color: "#555", paddingLeft: "2px" }}>  → {d.mekanik.nama}</div>}
            </div>
          ))}

          {/* Totals */}
          <div className="total-section">
            <div className="row"><span>Subtotal</span><span>{formatRupiah(tx.subtotal)}</span></div>
            {tx.diskon > 0 && <div className="row"><span>Diskon ({tx.diskon}%)</span><span>-{formatRupiah(tx.subtotal * tx.diskon / 100)}</span></div>}
            {tx.pajak > 0 && <div className="row"><span>Pajak ({tx.pajak}%)</span><span>{formatRupiah((tx.subtotal * (1 - tx.diskon / 100)) * tx.pajak / 100)}</span></div>}
            <div className="divider" />
            <div className="row grand-total"><span>TOTAL</span><span>{formatRupiah(tx.total)}</span></div>
            {tx.metodePembayaran && (
              <>
                <div className="row"><span>Metode</span><span>{tx.metodePembayaran}</span></div>
                <div className="row"><span>Dibayar</span><span>{formatRupiah(tx.dibayar)}</span></div>
                {tx.kembalian > 0 && <div className="row bold"><span>Kembalian</span><span>{formatRupiah(tx.kembalian)}</span></div>}
              </>
            )}
          </div>

          {/* Status */}
          <div className="divider" />
          <div className="center bold" style={{ fontSize: "14px", padding: "4px 0" }}>
            {tx.status === "LUNAS" ? "✓ LUNAS" : tx.status}
          </div>

          {/* Footer */}
          <div className="footer">
            <div className="divider" />
            <div>{cfg.footer_invoice ?? "Terima kasih atas kepercayaan Anda!"}</div>
            <div style={{ marginTop: "4px", fontSize: "10px" }}>Cetak: {formatDateTime(new Date())}</div>
          </div>

          {/* Print button */}
          <div className="no-print" style={{ marginTop: "16px", textAlign: "center" }}>
            <button
              onClick={() => window.print()}
              style={{ background: "#7c3aed", color: "#fff", border: "none", borderRadius: "8px", padding: "10px 24px", fontSize: "14px", cursor: "pointer", marginRight: "8px" }}
            >
              🖨️ Cetak Invoice
            </button>
            <button
              onClick={() => window.close()}
              style={{ background: "#f1f5f9", color: "#374151", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 24px", fontSize: "14px", cursor: "pointer" }}
            >
              Tutup
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
