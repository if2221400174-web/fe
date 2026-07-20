import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getPemeriksaan } from "../../../_sevices/pemeriksaan";
import { createTransaksi, getTransaksi, updateTransaksi } from "../../../_sevices/transaksi";
import { jsPDF } from "jspdf";

const formatRupiah = (angka) =>
  "Rp " + Number(angka).toLocaleString("id-ID");

const formatTanggal = (tanggal) =>
  new Date(tanggal).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatTanggalPendek = (tanggal) =>
  new Date(tanggal).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

export default function CreateTransaksi() {
  const { pemeriksaanId } = useParams();
  const navigate = useNavigate();

  const [pemeriksaan, setPemeriksaan] = useState(null);
  const [existingTransaksi, setExistingTransaksi] = useState(null);
  const [jasaMedis, setJasaMedis] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // State untuk Modal Cetak
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printFormat, setPrintFormat] = useState("pdf"); // pdf atau cetak
  const [printType, setPrintType] = useState("pembayaran"); // pembayaran atau lengkap

  useEffect(() => {
    const fetchData = async () => {
      try {
        const allTransaksi = await getTransaksi();
        const existingFound = allTransaksi.find(
          (t) => t.pemeriksaan_id === Number(pemeriksaanId)
        );

        if (existingFound) {
          setExistingTransaksi(existingFound);
          setPemeriksaan(existingFound.pemeriksaan);
          setJasaMedis(String(existingFound.jasa_medis));
        } else {
          const allPemeriksaan = await getPemeriksaan();
          const found = allPemeriksaan.find(
            (p) => p.id === Number(pemeriksaanId)
          );
          if (!found) throw new Error("Pemeriksaan tidak ditemukan.");
          setPemeriksaan(found);
        }
      } catch (err) {
        console.error(err);
        setError("Gagal memuat data pemeriksaan.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [pemeriksaanId]);

  const daftarObat =
    pemeriksaan?.resep?.flatMap((r) =>
      r.details?.map((d) => ({
        ...d,
        nama_obat: d.obat?.nama_obat ?? "—",
        harga_obat: Number(d.obat?.harga_obat ?? 0),
        aturan_pakai: d.aturan_pakai ?? "",
      })) ?? []
    ) ?? [];

  const totalObat = daftarObat.reduce((sum, d) => sum + d.harga_obat, 0);
  const jasaMedisNum = Number(jasaMedis) || 0;
  const totalTarif = totalObat + jasaMedisNum;

  const namaPasien = pemeriksaan?.rekam_medis?.pasien?.nama ?? "—";

  // --- Fungsi jika Admin yang membuat Transaksi ---
  const handleSubmit = async () => {
    if (!jasaMedis || jasaMedisNum < 0) {
      setError("Masukkan jasa medis yang valid (minimal Rp 0).");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await createTransaksi({
        pemeriksaan_id: Number(pemeriksaanId),
        jasa_medis: jasaMedisNum,
      });
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      if (err?.response?.status === 409) {
        setError("Transaksi untuk pemeriksaan ini sudah pernah dibuat.");
      } else {
        setError("Gagal menyimpan transaksi. Coba lagi.");
      }
    } finally {
      setSaving(false);
    }
  };

  // --- Fungsi Khusus Pelunasan (Admin Mengubah Status menjadi Lunas) ---
  const handlePelunasan = async () => {
    setError("");
    setSaving(true);
    try {
      await updateTransaksi(existingTransaksi.id, {
        pemeriksaan_id: existingTransaksi.pemeriksaan_id,
        jasa_medis: existingTransaksi.jasa_medis,
        status: "lunas" // Mengirim perintah lunas ke backend
      });
      window.location.reload(); 
    } catch (err) {
      console.error(err);
      setError("Gagal memproses pelunasan transaksi. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  // --- Fungsi Export PDF Struk ---
  const handleExportPDF = (type) => {
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [80, 200] });

      doc.setFontSize(12);
      doc.text("Praktek Dokter Umum dr. Rowi", 40, 10, { align: "center" });
      
      doc.setFontSize(9);
      doc.text(type === "lengkap" ? "Struk & Rekam Medis" : "Struk Pembayaran", 40, 15, { align: "center" });
      doc.text("-----------------------------------------", 40, 18, { align: "center" });
      
      doc.setFontSize(8);
      doc.text(`Waktu : ${formatTanggalPendek(existingTransaksi?.created_at || new Date())}`, 5, 23);
      doc.text(`Pasien: ${namaPasien}`, 5, 27);
      
      doc.text("-----------------------------------------", 40, 31, { align: "center" });
      
      let y = 35;

      if (type === "lengkap") {
        doc.setFontSize(9);
        doc.text("Data Medis:", 5, y);
        y += 4;
        
        doc.setFontSize(8);
        const printWrappedText = (label, text, startY) => {
          doc.text(`${label}:`, 5, startY);
          const lines = doc.splitTextToSize(text || "-", 65);
          doc.text(lines, 5, startY + 4);
          return startY + 4 + (lines.length * 4);
        };

        y = printWrappedText("Keluhan", pemeriksaan?.keluhan, y);
        y = printWrappedText("Diagnosa", pemeriksaan?.diagnosa, y);
        y = printWrappedText("Catatan", pemeriksaan?.catatan, y);
        
        doc.text("-----------------------------------------", 40, y, { align: "center" });
        y += 5;
      }

      doc.setFontSize(9);
      doc.text("Rincian Obat:", 5, y);
      y += 4;
      
      doc.setFontSize(8);
      daftarObat.forEach((obat) => {
        doc.text(`- ${obat.nama_obat}`, 5, y);
        doc.text(formatRupiah(obat.harga_obat), 75, y, { align: "right" });
        y += 4;
        
        if (type === "lengkap" && obat.aturan_pakai) {
          doc.setFontSize(7);
          doc.setTextColor(100, 100, 100); 
          const aturanLines = doc.splitTextToSize(`Aturan: ${obat.aturan_pakai}`, 65);
          doc.text(aturanLines, 8, y);
          y += (aturanLines.length * 3) + 1;
          doc.setFontSize(8);
          doc.setTextColor(0, 0, 0); 
        }
      });
      
      y += 2;
      doc.text("Jasa Medis:", 5, y);
      doc.text(formatRupiah(existingTransaksi?.jasa_medis || 0), 75, y, { align: "right" });
      
      y += 4;
      doc.text("-----------------------------------------", 40, y, { align: "center" });
      
      y += 5;
      doc.setFontSize(10);
      doc.text("TOTAL", 5, y);
      doc.text(formatRupiah(existingTransaksi?.total_tarif || 0), 75, y, { align: "right" });
      
      y += 10;
      doc.setFontSize(8);
      doc.text("Terima Kasih", 40, y, { align: "center" });
      doc.text("Semoga Lekas Sembuh", 40, y + 4, { align: "center" });

      doc.save(`Struk_${namaPasien}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("Gagal cetak PDF:", error);
      alert("Terjadi kesalahan saat mencetak PDF.");
    }
  };

  // --- Fungsi Cetak (Print Browser) ---
  const handleCetak = (type) => {
    const printWindow = window.open('', '_blank');
    
    let obatHtml = '';
    daftarObat.forEach(obat => {
      obatHtml += `
        <div style="display: flex; justify-content: space-between; margin-bottom: 2px;">
          <span>- ${obat.nama_obat}</span>
          <span>${formatRupiah(obat.harga_obat)}</span>
        </div>
      `;
      if (type === "lengkap" && obat.aturan_pakai) {
        obatHtml += `<div style="font-size: 10px; color: #555; margin-left: 10px; margin-bottom: 4px; line-height: 1.2;">Aturan: ${obat.aturan_pakai}</div>`;
      }
    });

    let rekamMedisHtml = '';
    if (type === "lengkap") {
      rekamMedisHtml = `
        <div class="divider"></div>
        <div style="font-size: 12px; margin-bottom: 10px;">
          <div class="bold" style="margin-bottom: 5px; font-size: 13px;">Data Medis:</div>
          <div style="margin-bottom: 5px;"><span class="bold">Keluhan:</span> <br/>${pemeriksaan?.keluhan || "-"}</div>
          <div style="margin-bottom: 5px;"><span class="bold">Diagnosa:</span> <br/>${pemeriksaan?.diagnosa || "-"}</div>
          <div style="margin-bottom: 5px;"><span class="bold">Catatan:</span> <br/>${pemeriksaan?.catatan || "-"}</div>
        </div>
      `;
    }

    const html = `
      <html>
        <head>
          <title>Struk Pembayaran - ${namaPasien}</title>
          <style>
            body { font-family: monospace; padding: 10px; width: 75mm; margin: 0 auto; color: #000; }
            .text-center { text-align: center; }
            .divider { border-bottom: 1px dashed #000; margin: 10px 0; }
            .flex-between { display: flex; justify-content: space-between; margin-bottom: 5px; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="text-center bold" style="font-size: 16px;">Praktek Dokter Umum dr. Rowi</div>
          <div class="text-center" style="font-size: 12px; margin-bottom: 10px;">
            Struk Pembayaran ${type === "lengkap" ? "& Rekam Medis" : ""}
          </div>
          <div class="divider"></div>
          <div style="font-size: 12px; margin-bottom: 10px;">
            <div>Waktu : ${formatTanggalPendek(existingTransaksi?.created_at || new Date())}</div>
            <div>Pasien: ${namaPasien}</div>
          </div>
          ${rekamMedisHtml}
          <div class="divider"></div>
          <div style="font-size: 12px;">
            <div style="margin-bottom: 5px;" class="bold">Rincian Obat:</div>
            ${obatHtml}
            <div style="margin-top: 10px;" class="flex-between">
              <span>Jasa Medis:</span>
              <span>${formatRupiah(existingTransaksi?.jasa_medis || 0)}</span>
            </div>
          </div>
          <div class="divider"></div>
          <div class="flex-between bold" style="font-size: 14px;">
            <span>TOTAL:</span>
            <span>${formatRupiah(existingTransaksi?.total_tarif || 0)}</span>
          </div>
          <div class="divider"></div>
          <div class="text-center" style="font-size: 12px; margin-top: 15px;">
            <div>Terima Kasih</div>
            <div>Semoga Lekas Sembuh</div>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(html);
    printWindow.document.close();
    setTimeout(() => { printWindow.print(); }, 300);
  };

  const executePrint = () => {
    if (printFormat === "pdf") handleExportPDF(printType);
    else handleCetak(printType);
    setShowPrintModal(false);
  };

  if (loading) {
    return (
      <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Memuat data transaksi...</p>
        </div>
      </section>
    );
  }

  if (!pemeriksaan) {
    return (
      <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-semibold text-red-500 mb-2">{error || "Data tidak ditemukan."}</p>
          <Link to="/admin/pemeriksaan" className="text-xs text-green-700 dark:text-green-400 underline">
            ← Kembali ke Pemeriksaan
          </Link>
        </div>
      </section>
    );
  }

  // --- LOGIKA STATUS TRANSAKSI ---
  const sudahDiajukan = existingTransaksi !== null;
  const sudahLunas = existingTransaksi?.status === 'lunas';

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {sudahLunas ? "Detail Transaksi (Lunas)" : sudahDiajukan ? "Pelunasan Pembayaran" : "Buat Transaksi"}
          </h1>
          <p className="text-sm font-semibold text-green-700 dark:text-green-400 mb-0.5">
            {namaPasien}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pemeriksaan {formatTanggal(pemeriksaan.tanggal_pemeriksaan)}
            {pemeriksaan.user?.username && (
              <> &middot; {pemeriksaan.user.username}</>
            )}
          </p>
        </div>

        {/* ── Badge Belum Lunas (Kuning/Amber) ── */}
        {sudahDiajukan && !sudahLunas && (
          <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                  Tagihan Belum Dilunasi
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Total yang harus dibayar: {formatRupiah(existingTransaksi.total_tarif)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ── Badge Sudah Lunas & Tombol Cetak (Hijau) ── */}
        {sudahLunas && (
          <div className="mb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl px-4 py-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-800/40 flex items-center justify-center flex-shrink-0">
                <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                  Transaksi Berhasil & Lunas
                </p>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Total tarif: {formatRupiah(existingTransaksi.total_tarif)}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setShowPrintModal(true)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
              Cetak / Export
            </button>
          </div>
        )}

        {/* ── Card info pemeriksaan ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-4 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hasil Pemeriksaan</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-700">
            <div className="px-5 py-4">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Keluhan</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{pemeriksaan.keluhan || "—"}</p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Diagnosa</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{pemeriksaan.diagnosa || "—"}</p>
            </div>
          </div>
        </div>

        {/* ── Card Resep Obat ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-4 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Resep Obat</p>
          </div>
          {daftarObat.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left min-w-[500px]">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700">
                    <th className="px-5 py-2.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider w-8">No.</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Nama Obat</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Aturan Pakai</th>
                    <th className="px-5 py-2.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider text-right">Harga</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {daftarObat.map((d, i) => (
                    <tr key={d.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td className="px-5 py-3 text-xs text-gray-400 dark:text-gray-500 font-medium">{i + 1}</td>
                      <td className="px-5 py-3 font-semibold text-gray-900 dark:text-white">{d.nama_obat}</td>
                      <td className="px-5 py-3 text-gray-600 dark:text-gray-300 capitalize">{d.aturan_pakai ?? "—"}</td>
                      <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-right">{formatRupiah(d.harga_obat)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="px-5 py-4 text-sm text-gray-400 dark:text-gray-500 italic">Tidak ada obat dalam resep.</p>
          )}
        </div>

        {/* ── Card Rincian Biaya ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Rincian Biaya</p>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Obat</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatRupiah(totalObat)}</p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <label className="text-sm text-gray-600 dark:text-gray-300 flex-shrink-0">Jasa Medis</label>
              {sudahDiajukan ? (
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatRupiah(existingTransaksi.jasa_medis)}
                </p>
              ) : (
                <div className="relative w-48">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 pointer-events-none select-none">Rp</span>
                  <input type="number" min="0" step="1000" placeholder="0" value={jasaMedis}
                    onChange={(e) => setJasaMedis(e.target.value)}
                    className="w-full text-sm text-right rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500" />
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900 dark:text-white">Total Tarif</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-400">
                  {sudahDiajukan ? formatRupiah(existingTransaksi.total_tarif) : formatRupiah(totalTarif)}
                </p>
              </div>
              {!sudahDiajukan && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">Total Obat + Jasa Medis</p>}
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
            <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* ── Aksi Bawah ── */}
        <div className="flex items-center justify-end gap-3">
          {sudahLunas ? (
            // JIKA LUNAS: Muncul navigasi kembali
            <>
              <Link to="/admin/pemeriksaan" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-green-600 dark:text-green-300 border border-green-200 dark:border-green-600 rounded-lg hover:bg-green-100 dark:hover:bg-green-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                Pemeriksaan
              </Link>
              <Link to="/admin/transaksi" className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-green-600 dark:text-green-300 border border-green-200 dark:border-green-600 rounded-lg hover:bg-green-100 dark:hover:bg-green-700 transition-colors">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                Transaksi
              </Link>
            </>
          ) : sudahDiajukan ? (
            // JIKA BELUM LUNAS TAPI SUDAH DIBUAT DOKTER: Tombol Lunasi
            <button type="button" onClick={handlePelunasan} disabled={saving} className="inline-flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg transition-colors disabled:opacity-60 shadow-sm">
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Memproses...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>Proses Pelunasan</>
              )}
            </button>
          ) : (
            // JIKA SAMA SEKALI BELUM DIBUAT (KOSONG): Tombol Buat Draft
            <button type="button" onClick={handleSubmit} disabled={saving} className="inline-flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-60 shadow-sm">
              {saving ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Menyimpan...</>
              ) : (
                <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>Buat Draft Transaksi</>
              )}
            </button>
          )}
        </div>
      </div>

      {/* MODAL OPSI CETAK */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 dark:border-gray-700">Opsi Cetak / Export</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Format Aksi</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" value="pdf" checked={printFormat === "pdf"} onChange={(e) => setPrintFormat(e.target.value)} className="w-4 h-4 text-blue-600" />
                    Download PDF
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" value="cetak" checked={printFormat === "cetak"} onChange={(e) => setPrintFormat(e.target.value)} className="w-4 h-4 text-blue-600" />
                    Cetak Langsung (Print)
                  </label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Informasi yang Ditampilkan</label>
                <div className="flex flex-col gap-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" value="pembayaran" checked={printType === "pembayaran"} onChange={(e) => setPrintType(e.target.value)} className="w-4 h-4 text-blue-600" />
                    Hanya Struk Pembayaran
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" value="lengkap" checked={printType === "lengkap"} onChange={(e) => setPrintType(e.target.value)} className="w-4 h-4 text-blue-600" />
                    Lengkap (Pembayaran, Keluhan, Diagnosa, Catatan & Aturan Pakai)
                  </label>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setShowPrintModal(false)} className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Batal</button>
              <button onClick={executePrint} className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-medium transition-colors">
                {printFormat === "pdf" ? "Download PDF" : "Lanjutkan Cetak"}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}