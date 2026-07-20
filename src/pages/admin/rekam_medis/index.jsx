import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getRekamMedis } from "../../../_sevices/rekamMedis";
import { userImageStorage } from "../../../_api";

// Import untuk PDF dan Excel
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export default function RekamMedisPasien() {
  const { pasienId } = useParams();
  const [rekamMedis, setRekamMedis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expandedPemeriksaan, setExpandedPemeriksaan] = useState({});

  // State Modal Export
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf"); // "pdf", "excel", "cetak"
  const [exportPeriod, setExportPeriod] = useState("semua"); // "semua", "bulanan", "tahunan"
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getRekamMedis();
        const found = data.find((rm) => rm.pasien_id === parseInt(pasienId));
        setRekamMedis(found || null);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [pasienId]);

  const togglePemeriksaan = (id) => {
    setExpandedPemeriksaan((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const formatTanggal = (tanggal) => {
    return new Date(tanggal).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Memuat rekam medis...</p>
        </div>
      </section>
    );
  }

  const { pasien, pemeriksaan } = rekamMedis;
  // Urutkan dari yang terbaru di atas
  const pemeriksaanTerbalik = [...pemeriksaan].reverse();

  // --- HELPER EXPORT ---
  const getObatString = (pemeriksaanObj, format = "text") => {
    const allObat = pemeriksaanObj.resep?.flatMap(r => r.details) || [];
    if (allObat.length === 0) return "-";
    
    if (format === "html") {
      return allObat.map(d => `&bull; ${d.obat?.nama_obat ?? "-"} <br/><i style="font-size: 11px; color:#555; margin-left: 10px;">${d.aturan_pakai ?? "-"}</i>`).join("<br/>");
    }
    return allObat.map(d => `• ${d.obat?.nama_obat ?? "-"} (${d.aturan_pakai ?? "-"})`).join("\n");
  };

  const handleExportPDF = (filteredData) => {
    try {
      const doc = new jsPDF("landscape");
      
      // Header & Judul
      doc.setFontSize(14);
      doc.text("Riwayat Rekam Medis Pasien", 14, 15);
      doc.setFontSize(10);
      doc.text("Klinik Praktek Dokter Umum dr. Rowi", 14, 22);

      // Data Identitas Pasien
      doc.setFontSize(10);
      doc.text(`Kode RM      : ${pasien.kode_rekammedis || "-"}`, 14, 32);
      doc.text(`Nama         : ${pasien.nama || "-"}`, 14, 38);
      doc.text(`Umur         : ${pasien.umur ? pasien.umur + " Tahun" : "-"}`, 14, 44);
      
      doc.text(`Jenis Kelamin: ${pasien.jenis_kelamin || "-"}`, 130, 32);
      doc.text(`Alamat       : ${pasien.alamat || "-"}`, 130, 38);

      // Periode
      let subtitle = "Periode Laporan : ";
      if (exportPeriod === "bulanan") subtitle += `Bulan ${exportMonth} Tahun ${exportYear}`;
      else if (exportPeriod === "tahunan") subtitle += `Tahun ${exportYear}`;
      else subtitle += "Semua Data";
      
      doc.text(subtitle, 14, 52);

      // Tabel Pemeriksaan
      const tableColumn = ["No", "Tanggal", "Pemeriksa", "Keluhan", "Diagnosa", "Catatan", "Obat & Aturan Pakai"];
      const tableRows = [];

      filteredData.forEach((p, index) => {
        const rowData = [
          index + 1,
          formatTanggal(p.tanggal_pemeriksaan),
          p.user?.username ?? "-",
          p.keluhan ?? "-",
          p.diagnosa ?? "-",
          p.catatan ?? "-",
          getObatString(p, "text")
        ];
        tableRows.push(rowData);
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 58, // Mulai tabel di bawah identitas
        theme: 'grid',
        styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
        columnStyles: { 6: { cellWidth: 45 } },
        headStyles: { fillColor: [22, 163, 74] } 
      });

      doc.save(`Rekam_Medis_${pasien.nama}_${new Date().getTime()}.pdf`);
    } catch (error) {
      console.error("Gagal export PDF:", error);
      alert("Terjadi kesalahan saat mengekspor ke PDF.");
    }
  };

  const handleExportExcel = (filteredData) => {
    try {
      // Kita cantumkan identitas pasien di setiap baris laporan excel agar rapi
      const dataToExport = filteredData.map((p, index) => ({
        "No": index + 1,
        "Kode RM": pasien.kode_rekammedis || "-",
        "Nama Pasien": pasien.nama || "-",
        "Umur": pasien.umur ? `${pasien.umur} Tahun` : "-",
        "Jenis Kelamin": pasien.jenis_kelamin || "-",
        "Alamat": pasien.alamat || "-",
        "Tanggal Periksa": formatTanggal(p.tanggal_pemeriksaan),
        "Dokter Pemeriksa": p.user?.username ?? "-",
        "Keluhan": p.keluhan ?? "-",
        "Diagnosa": p.diagnosa ?? "-",
        "Catatan Edukasi": p.catatan ?? "-",
        "Obat & Aturan Pakai": getObatString(p, "text")
      }));

      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Riwayat_RM");
      
      // Atur lebar kolom
      worksheet['!cols'] = [
        { wch: 5 }, { wch: 15 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 30 }, 
        { wch: 18 }, { wch: 20 }, { wch: 30 }, { wch: 30 }, { wch: 30 }, { wch: 40 }
      ];

      XLSX.writeFile(workbook, `Rekam_Medis_${pasien.nama}_${new Date().getTime()}.xlsx`);
    } catch (error) {
      console.error("Gagal export Excel:", error);
      alert("Terjadi kesalahan saat mengekspor ke Excel.");
    }
  };

  const handleCetak = (filteredData) => {
    const printWindow = window.open("", "_blank");
    
    let tableRows = "";
    filteredData.forEach((p, index) => {
      tableRows += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${formatTanggal(p.tanggal_pemeriksaan)}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${p.user?.username ?? "-"}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${p.keluhan ?? "-"}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${p.diagnosa ?? "-"}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${p.catatan ?? "-"}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${getObatString(p, "html")}</td>
        </tr>
      `;
    });

    let subtitle = `Periode: `;
    if (exportPeriod === "bulanan") subtitle += `Bulan ${exportMonth} Tahun ${exportYear}`;
    else if (exportPeriod === "tahunan") subtitle += `Tahun ${exportYear}`;
    else subtitle += `Semua Data`;

    const html = `
      <html>
        <head>
          <title>Riwayat Rekam Medis - ${pasien.nama}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h2 { text-align: center; margin-bottom: 5px; }
            p.klinik { text-align: center; margin-top: 0; color: #666; font-size: 14px; margin-bottom: 20px; line-height: 1.5; }
            .identity-box { border: 1px solid #ddd; padding: 15px; margin-bottom: 20px; border-radius: 5px; background-color: #f9f9f9; display: flex; flex-wrap: wrap; }
            .identity-col { flex: 1; min-width: 250px; }
            .identity-item { margin-bottom: 8px; font-size: 13px; }
            .identity-label { font-weight: bold; display: inline-block; width: 120px; }
            table.data-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
            table.data-table th { background-color: #f4f4f4; padding: 10px; border: 1px solid #ddd; text-align: left; }
            table.data-table td { padding: 8px; border: 1px solid #ddd; vertical-align: top; }
            @media print {
              @page { size: landscape; margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <h2>Riwayat Rekam Medis Pasien</h2>
          <p class="klinik">Praktek Dokter Umum dr. Rowi<br/>${subtitle}</p>
          
          <div class="identity-box">
            <div class="identity-col">
              <div class="identity-item"><span class="identity-label">Kode RM</span>: ${pasien.kode_rekammedis || "-"}</div>
              <div class="identity-item"><span class="identity-label">Nama Pasien</span>: ${pasien.nama || "-"}</div>
              <div class="identity-item"><span class="identity-label">Umur</span>: ${pasien.umur ? pasien.umur + " Tahun" : "-"}</div>
            </div>
            <div class="identity-col">
              <div class="identity-item"><span class="identity-label">Jenis Kelamin</span>: ${pasien.jenis_kelamin || "-"}</div>
              <div class="identity-item"><span class="identity-label">Alamat</span>: ${pasien.alamat || "-"}</div>
            </div>
          </div>
          
          <table class="data-table">
            <thead>
              <tr>
                <th style="width: 3%; text-align: center;">No</th>
                <th style="width: 12%;">Tanggal</th>
                <th style="width: 15%;">Pemeriksa</th>
                <th style="width: 15%;">Keluhan</th>
                <th style="width: 15%;">Diagnosa</th>
                <th style="width: 15%;">Catatan</th>
                <th style="width: 25%;">Obat & Aturan Pakai</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const executeExport = () => {
    let filtered = [...pemeriksaanTerbalik]; // Menggunakan urutan terbaru
    
    if (exportPeriod === "bulanan") {
      filtered = filtered.filter(item => {
        const date = new Date(item.tanggal_pemeriksaan);
        return date.getMonth() + 1 === Number(exportMonth) && date.getFullYear() === Number(exportYear);
      });
    } else if (exportPeriod === "tahunan") {
      filtered = filtered.filter(item => {
        const date = new Date(item.tanggal_pemeriksaan);
        return date.getFullYear() === Number(exportYear);
      });
    }

    if (filtered.length === 0) {
      alert(`Mohon maaf, tidak ada catatan rekam medis pada periode yang kamu pilih.`);
      return;
    }

    if (exportFormat === "pdf") {
      handleExportPDF(filtered);
    } else if (exportFormat === "excel") {
      handleExportExcel(filtered);
    } else {
      handleCetak(filtered);
    }
    setShowExportModal(false);
  };
  // -------------------------

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen relative">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6">

        {/* ── Navigasi Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
          <Link to="/admin/pasien" className="hover:text-green-700 dark:hover:text-green-400 transition-colors duration-150">
            Manajemen Pasien
          </Link>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 dark:text-white font-medium truncate">{pasien.nama}</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          <span className="text-gray-900 dark:text-white font-medium">Rekam Medis</span>
        </nav>

        {/* ── Judul Halaman ── */}
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 text-center sm:text-left">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Rekam Medis Pasien
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Riwayat pemeriksaan setiap pasien Praktek Umum Mandiri Dr. Rowi
            </p>
          </div>
        </div>

        {/* ── Kartu Identitas Pasien ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 overflow-hidden">
          <div className="bg-green-700 dark:bg-green-800 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-semibold text-white">Identitas Pasien</span>
            </div>
            <span className="text-xs font-mono font-medium text-green-100 bg-white/20 px-2.5 py-1 rounded">
              {pasien.kode_rekammedis}
            </span>
          </div>

          <div className="px-5 py-5 overflow-x-auto">
            <div className="min-w-max grid grid-flow-col auto-cols-max gap-x-6 gap-y-4">
              {[
                { label: "Nama", value: pasien.nama ? pasien.nama : "—" },
                { label: "Umur", value: pasien.umur ? `${pasien.umur} Tahun` : "—" },
                { label: "Jenis Kelamin", value: pasien.jenis_kelamin ? pasien.jenis_kelamin : "—" },
                { label: "Alamat", value: pasien.alamat || "—" },
              ].map((item) => (
                <div key={item.label} className="min-w-[150px] max-w-xs">
                  <p className="text-sm text-gray-900 dark:text-gray-500 mb-1 uppercase tracking-wide font-medium">
                    {item.label}
                  </p>
                  <p className="text-sm text-gray-700 dark:text-white leading-snug break-words">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-3 bg-gray-50 dark:bg-gray-700/20 flex flex-wrap items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Total Pemeriksaan:&nbsp;
                <span className="font-semibold text-gray-900 dark:text-white">{pemeriksaan.length}x</span>
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Terakhir Periksa:&nbsp;
                <span className="font-semibold text-gray-900 dark:text-white">
                  {pemeriksaan.length > 0
                    ? formatTanggal(pemeriksaan[pemeriksaan.length - 1].tanggal_pemeriksaan)
                    : "Belum ada"}
                </span>
              </span>
            </div>
          </div>
        </div>
        
        {/* ── Riwayat Pemeriksaan & Tombol Export ── */}
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
              Riwayat Pemeriksaan
            </h2>
            <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full font-medium">
              {pemeriksaan.length} Pemeriksaan
            </span>
          </div>

          {pemeriksaan.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowExportModal(true)}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export / Cetak Laporan
              </button>
            </div>
          )}
        </div>

        {pemeriksaan.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-center py-14">
            <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-semibold text-gray-700 dark:text-white mb-1">Belum Ada Pemeriksaan</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Pasien ini belum memiliki riwayat pemeriksaan.</p>
            <Link
              to={`/admin/pemeriksaan/create/${pasienId}`}
              className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Tambah Pemeriksaan Pertama
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {pemeriksaanTerbalik.map((p, index) => {
              const isOpen = expandedPemeriksaan[p.id] ?? index === 0;
              const allObat = p.resep?.flatMap((r) => r.details) || [];
              const nomorUrut = pemeriksaan.length - index;

              return (
                <div key={p.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <button
                    onClick={() => togglePemeriksaan(p.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150 text-left gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-green-700 dark:bg-green-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">{nomorUrut}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          Pemeriksaan {formatTanggal(p.tanggal_pemeriksaan)}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Pemeriksa:&nbsp;
                            <span className="font-medium text-gray-700 dark:text-gray-300">{p.user?.username || "—"}</span>
                          </span>
                          <span className="hidden sm:inline text-gray-300 dark:text-gray-600">·</span>
                          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                            allObat.length > 0
                              ? "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
                          }`}>
                            {allObat.length > 0 ? `${allObat.length} Obat` : "Tanpa Resep"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {isOpen && (
                    <div className="border-t border-gray-100 dark:border-gray-700">
                      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-700">
                        <div className="px-5 py-4">
                          <p className="text-xs font-semibold text-gray-900 dark:text-gray-500 uppercase tracking-wider mb-2">Keluhan Pasien</p>
                          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{p.keluhan || "—"}</p>
                        </div>
                        <div className="px-5 py-4">
                          <p className="text-xs font-semibold text-gray-900 dark:text-gray-500 uppercase tracking-wider mb-2">Diagnosa</p>
                          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">{p.diagnosa || "—"}</p>
                        </div>
                      </div>

                      {p.catatan && (
                        <div className="mx-5 mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg px-4 py-3">
                          <p className="text-xs font-medium text-bold text-center text-green-900 dark:text-green-400 uppercase tracking-wider mb-1.5">Catatan Edukasi</p>
                          <p className="text-sm text-center text-green-700 dark:text-green-200 leading-relaxed">{p.catatan}</p>
                        </div>
                      )}

                      <div className="px-5 pb-4">
                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-500 uppercase tracking-wider mb-3">Resep Obat</p>
                        {allObat.length === 0 ? (
                          <p className="text-xs text-gray-400 dark:text-gray-500 italic">Tidak ada resep obat pada pemeriksaan ini.</p>
                        ) : (
                          <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm text-left min-w-[500px]">
                                <thead>
                                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase tracking-wider w-10">No.</th>
                                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Nama Obat</th>
                                    <th className="px-4 py-2.5 text-xs font-semibold text-gray-700 dark:text-gray-400 uppercase tracking-wider">Aturan Pakai</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                                  {allObat.map((detail, i) => (
                                    <tr key={detail.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                      <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 font-medium">{i + 1}</td>
                                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 capitalize">{detail.obat?.nama_obat || "—"}</td>
                                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 capitalize">{detail.aturan_pakai || "—"}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-700/20 border-t border-gray-100 dark:border-gray-700">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-300 dark:border-gray-500">
                            {p.user?.foto ? (
                              <img src={`${userImageStorage}/${p.user.foto}`} alt={p.user.username} className="w-full h-full object-cover" />
                            ) : (
                              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-900 dark:text-white">{p.user?.username || "—"}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{p.user?.role === "admin" ? "Dokter" : (p.user?.role || "—")}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* MODAL EXPORT & CETAK */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 dark:border-gray-700">Export / Cetak Riwayat RM</h3>
            
            <div className="space-y-5">
              {/* Format File */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pilih Format</label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600 transition-colors">
                    <input type="radio" value="pdf" checked={exportFormat === "pdf"} onChange={(e) => setExportFormat(e.target.value)} className="w-4 h-4 text-blue-600" />
                    Download PDF
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600 transition-colors">
                    <input type="radio" value="excel" checked={exportFormat === "excel"} onChange={(e) => setExportFormat(e.target.value)} className="w-4 h-4 text-blue-600" />
                    Download Excel
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-blue-600 transition-colors">
                    <input type="radio" value="cetak" checked={exportFormat === "cetak"} onChange={(e) => setExportFormat(e.target.value)} className="w-4 h-4 text-blue-600" />
                    Cetak (Print)
                  </label>
                </div>
              </div>

              {/* Periode */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Periode Laporan</label>
                <select 
                  value={exportPeriod} 
                  onChange={(e) => setExportPeriod(e.target.value)}
                  className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2.5 mb-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="semua">Semua Data</option>
                  <option value="bulanan">Bulan Tertentu</option>
                  <option value="tahunan">Tahun Tertentu</option>
                </select>

                {/* Filter Tambahan jika Bulanan/Tahunan */}
                {exportPeriod !== "semua" && (
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {exportPeriod === "bulanan" && (
                      <select
                        value={exportMonth}
                        onChange={(e) => setExportMonth(e.target.value)}
                        className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="1">Januari</option>
                        <option value="2">Februari</option>
                        <option value="3">Maret</option>
                        <option value="4">April</option>
                        <option value="5">Mei</option>
                        <option value="6">Juni</option>
                        <option value="7">Juli</option>
                        <option value="8">Agustus</option>
                        <option value="9">September</option>
                        <option value="10">Oktober</option>
                        <option value="11">November</option>
                        <option value="12">Desember</option>
                      </select>
                    )}
                    
                    <select
                      value={exportYear}
                      onChange={(e) => setExportYear(e.target.value)}
                      className={`w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 ${exportPeriod === "tahunan" ? "col-span-2" : ""}`}
                    >
                      {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowExportModal(false)} className="px-5 py-2 text-sm text-gray-700 font-medium bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Batal</button>
              <button onClick={executeExport} className="px-5 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 font-semibold transition-colors shadow-sm">
                Lanjutkan
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </section>
  );
}