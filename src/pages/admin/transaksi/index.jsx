import { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { deleteTransaksi, getTransaksi } from "../../../_sevices/transaksi";
import { exportToPDF, exportToExcel, filterDataByPeriod } from "../../../_sevices/exportTransaksi";

const formatRupiah = (angka) =>
  "Rp " + Number(angka).toLocaleString("id-ID");

const formatTanggalPendek = (tanggal) =>
  new Date(tanggal).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

export default function AdminTransaksi() {
  const [transaksiList, setTransaksiList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();

  // State untuk mode tampilan, pencarian, dan filter status
  const [viewMode, setViewMode] = useState("semua"); // "semua" atau "perPasien"
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("semua"); // "semua", "belum_bayar", "lunas"
  
  // State untuk Modal Export
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportFormat, setExportFormat] = useState("pdf"); // "pdf", "excel", "cetak"
  const [exportPeriod, setExportPeriod] = useState("semua");
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await getTransaksi();
        const sorted = [...data].sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at)
        );
        setTransaksiList(sorted);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    try {
      await deleteTransaksi(id);
      setTransaksiList((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Gagal menghapus transaksi:", err);
    } finally {
      setDeleteId(null);
    }
  };

  const hitungTotalObat = (t) => {
    const obatList =
      t.pemeriksaan?.resep?.flatMap((r) =>
        r.details?.map((d) => Number(d.obat?.harga_obat ?? 0)) ?? []
      ) ?? [];
    return obatList.reduce((sum, h) => sum + h, 0);
  };

  // --- LOGIKA FILTER & PEMBERITAHUAN ---
  const belumLunasCount = transaksiList.filter(t => t.status !== "lunas").length;

  const baseFilteredList = useMemo(() => {
    if (filterStatus === "belum_bayar") return transaksiList.filter(t => t.status !== "lunas");
    if (filterStatus === "lunas") return transaksiList.filter(t => t.status === "lunas");
    return transaksiList;
  }, [transaksiList, filterStatus]);

  // Filter Data untuk mode "Semua Transaksi"
  const filteredSemuaTransaksi = useMemo(() => {
    if (!searchQuery) return baseFilteredList;
    return baseFilteredList.filter(t => {
      const namaPasien = t.pemeriksaan?.rekam_medis?.pasien?.nama ?? "";
      return namaPasien.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [baseFilteredList, searchQuery]);

  // Group data per pasien
  const transaksiPerPasien = useMemo(() => {
    const grouped = {};
    baseFilteredList.forEach((t) => {
      const pasienId = t.pemeriksaan?.rekam_medis?.pasien?.id ?? "unknown";
      const namaPasien = t.pemeriksaan?.rekam_medis?.pasien?.nama ?? "Pasien Tidak Diketahui";
      const tDate = new Date(t.created_at).getTime();
      
      if (!grouped[pasienId]) {
        grouped[pasienId] = {
          id: pasienId,
          nama: namaPasien,
          transaksi: [],
          totalObat: 0,
          totalJasa: 0,
          totalSemua: 0,
          latestDate: tDate, 
        };
      } else {
        if (tDate > grouped[pasienId].latestDate) {
          grouped[pasienId].latestDate = tDate;
        }
      }
      
      grouped[pasienId].transaksi.push(t);
      grouped[pasienId].totalObat += hitungTotalObat(t);
      grouped[pasienId].totalJasa += Number(t.jasa_medis ?? 0);
      grouped[pasienId].totalSemua += Number(t.total_tarif ?? 0);
    });

    return Object.values(grouped).sort((a, b) => b.latestDate - a.latestDate);
  }, [baseFilteredList]);

  // Filter Data untuk mode "Per Pasien"
  const filteredPerPasien = useMemo(() => {
    if (!searchQuery) return transaksiPerPasien;
    return transaksiPerPasien.filter(p => 
      p.nama.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [transaksiPerPasien, searchQuery]);

  // Handle Cetak Langsung
  const handleCetak = (dataList) => {
    const printWindow = window.open("", "_blank");
    
    let tableRows = "";
    let totalJasa = 0;
    let totalObatSeluruh = 0;
    let totalAkhir = 0;

    dataList.forEach((t, index) => {
      const totalObat = hitungTotalObat(t);
      totalJasa += Number(t.jasa_medis ?? 0);
      totalObatSeluruh += totalObat;
      totalAkhir += Number(t.total_tarif ?? 0);

      tableRows += `
        <tr>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: center;">${index + 1}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${formatTanggalPendek(t.created_at)}</td>
          <td style="padding: 8px; border: 1px solid #ddd;">${t.pemeriksaan?.rekam_medis?.pasien?.nama ?? "—"}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatRupiah(totalObat)}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">${formatRupiah(t.jasa_medis ?? 0)}</td>
          <td style="padding: 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${formatRupiah(t.total_tarif ?? 0)}</td>
        </tr>
      `;
    });

    let subtitle = `Periode Laporan: `;
    if (exportPeriod === "bulanan") subtitle += `Bulan ${exportMonth} Tahun ${exportYear}`;
    else if (exportPeriod === "tahunan") subtitle += `Tahun ${exportYear}`;
    else subtitle += `Semua Data`;

    const html = `
      <html>
        <head>
          <title>Laporan Transaksi</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
            h2 { text-align: center; margin-bottom: 5px; }
            p { text-align: center; margin-top: 0; color: #666; font-size: 14px; margin-bottom: 20px; line-height: 1.5; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
            th { background-color: #f4f4f4; padding: 10px; border: 1px solid #ddd; text-align: left; }
            td { padding: 8px; border: 1px solid #ddd; vertical-align: top; }
            @media print {
              @page { size: landscape; margin: 10mm; }
            }
          </style>
        </head>
        <body>
          <h2>Laporan Transaksi Pembayaran</h2>
          <p>Praktek Dokter Umum dr. Rowi<br/>${subtitle}</p>
          
          <table>
            <thead>
              <tr>
                <th style="width: 5%; text-align: center;">No</th>
                <th style="width: 15%;">Tanggal</th>
                <th style="width: 25%;">Nama Pasien</th>
                <th style="width: 15%; text-align: right;">Harga Obat</th>
                <th style="width: 15%; text-align: right;">Jasa Medis</th>
                <th style="width: 20%; text-align: right;">Total Tarif</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
              <tr style="background-color: #fcfcfc;">
                <td colspan="3" style="padding: 10px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">TOTAL KESELURUHAN</td>
                <td style="padding: 10px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${formatRupiah(totalObatSeluruh)}</td>
                <td style="padding: 10px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold;">${formatRupiah(totalJasa)}</td>
                <td style="padding: 10px 8px; border: 1px solid #ddd; text-align: right; font-weight: bold; color: green;">${formatRupiah(totalAkhir)}</td>
              </tr>
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

  const handleExport = () => {
    const filteredData = filterDataByPeriod(transaksiList, exportPeriod, exportMonth, exportYear);
    
    if (filteredData.length === 0) {
      alert("Mohon maaf, tidak ada data transaksi pada periode yang kamu pilih.");
      return;
    }

    let fileName = `Laporan_Transaksi_${exportPeriod.toUpperCase()}`;
    if (exportPeriod === "bulanan") fileName += `_${exportMonth}_${exportYear}`;
    if (exportPeriod === "tahunan") fileName += `_${exportYear}`;

    if (exportFormat === "pdf") {
      exportToPDF(filteredData, fileName);
    } else if (exportFormat === "excel") {
      exportToExcel(filteredData, fileName);
    } else if (exportFormat === "cetak") {
      handleCetak(filteredData);
    }
    
    setShowExportModal(false);
  };

  if (loading) {
    return (
      <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Memuat riwayat transaksi...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6">

        {/* Pemberitahuan Jika Ada Tagihan Belum Lunas */}
        {belumLunasCount > 0 && (
          <div className="mb-6 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-800/40 flex items-center justify-center flex-shrink-0 text-amber-600 dark:text-amber-400">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              </div>
              <div>
                <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  Perhatian: Ada {belumLunasCount} Tagihan Belum Dibayar
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  Terdapat transaksi dari dokter yang menunggu proses pelunasan Admin.
                </p>
              </div>
            </div>
            <button
              onClick={() => { setViewMode("semua"); setFilterStatus("belum_bayar"); }}
              className="whitespace-nowrap px-4 py-2 text-sm font-semibold text-amber-700 bg-amber-100 hover:bg-amber-200 dark:bg-amber-800/50 dark:text-amber-300 dark:hover:bg-amber-700/50 rounded-lg transition-colors"
            >
              Lihat Tagihan
            </button>
          </div>
        )}

        {/* Judul & Action Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              Data Transaksi
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Transaksi pembayaran Praktek Dokter Umum dr. Rowi
            </p>
          </div>
          
          <button
            onClick={() => setShowExportModal(true)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"></path>
            </svg>
            Export / Cetak Laporan
          </button>
        </div>

        {/* Toggle View Mode, Filter Status & Search */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
          <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-lg w-fit">
            <button
              onClick={() => setViewMode("semua")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === "semua"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Semua Transaksi
            </button>
            <button
              onClick={() => setViewMode("perPasien")}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                viewMode === "perPasien"
                  ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              }`}
            >
              Per Pasien
            </button>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            {/* Dropdown Filter Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
            >
              <option value="semua">Semua Status</option>
              <option value="belum_bayar">Hanya Belum Lunas</option>
              <option value="lunas">Hanya Sudah Lunas</option>
            </select>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Cari nama pasien..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </div>
          </div>
        </div>

        {/* Konten Berdasarkan View Mode */}
        {viewMode === "semua" ? (
          /* TABEL SEMUA TRANSAKSI */
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto scrollbar-thin">
              {/* NOTE: Lebar minimum 950px agar rapi tidak berdesakan */}
              <table className="w-full text-sm text-left" style={{ minWidth: "950px" }}>
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 uppercase w-12">No.</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 uppercase">Tanggal</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 uppercase">Nama Pasien</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 uppercase text-right">Harga Obat</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 uppercase text-right">Jasa Medis</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 uppercase text-right">Total Tarif</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 uppercase text-center">Status</th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 uppercase text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {filteredSemuaTransaksi.length > 0 ? (
                    filteredSemuaTransaksi.map((t, i) => (
                      <tr key={t.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-4 py-3 text-gray-400 font-medium">{i + 1}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-medium">{formatTanggalPendek(t.created_at)}</td>
                        <td className="px-4 py-3 text-gray-900 dark:text-white font-semibold">{t.pemeriksaan?.rekam_medis?.pasien?.nama ?? "—"}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{formatRupiah(hitungTotalObat(t))}</td>
                        <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{formatRupiah(t.jasa_medis ?? 0)}</td>
                        <td className="px-4 py-3 text-right text-green-700 dark:text-green-400 font-bold">{formatRupiah(t.total_tarif ?? 0)}</td>
                        <td className="px-4 py-3 text-center">
                          {t.status === "lunas" ? (
                            <span className="px-2.5 py-1 text-[10px] font-bold text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-400 rounded-full whitespace-nowrap">Lunas</span>
                          ) : (
                            <span className="px-2.5 py-1 text-[10px] font-bold text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 rounded-full whitespace-nowrap">Belum Bayar</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="inline-flex items-center gap-1.5">
                              <button 
                                onClick={() => navigate(`/admin/transaksi/create/${t.pemeriksaan?.id || t.pemeriksaan_id || t.pemeriksaan_idpemeriksaan}`)} 
                                className={`px-2.5 py-1 text-[11px] font-medium border rounded-md transition-colors ${
                                  t.status === "lunas" 
                                    ? "text-gray-700 bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600" 
                                    : "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50"
                                }`}
                              >
                                {t.status === "lunas" ? "Detail" : "Proses Bayar"}
                              </button>
                              <button onClick={() => setDeleteId(t.id)} className="px-2.5 py-1 text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800/50 transition-colors">Hapus</button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                        Tidak ada transaksi yang cocok dengan pencarian atau filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* CARD VIEW PER PASIEN */
          <div className="space-y-4">
            {filteredPerPasien.length > 0 ? (
              filteredPerPasien.map((pasien) => (
                <div key={pasien.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  {/* Header Card */}
                  <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-0 bg-gray-50/50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg">
                        {pasien.nama.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">{pasien.nama}</h3>
                        <p className="text-sm text-gray-500">{pasien.transaksi.length} Transaksi</p>
                      </div>
                    </div>
                    <div className="text-left sm:text-right mt-2 sm:mt-0">
                      <p className="text-sm text-gray-500">Total Tarif Pasien Ini</p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">{formatRupiah(pasien.totalSemua)}</p>
                    </div>
                  </div>

                  {/* Tabel Kecil di dalam Card */}
                  <div className="overflow-x-auto p-4 scrollbar-thin">
                    {/* INI KUNCI PERBAIKANNYA: minWidth 750px agar tabel horizontal lurus (bisa discroll) dan tidak gepeng-gepeng lagi */}
                    <table className="w-full text-sm text-left" style={{ minWidth: "750px" }}>
                      <thead>
                        <tr className="text-gray-400 border-b border-gray-100 dark:border-gray-700 pb-2">
                          <th className="pb-2 font-medium w-10">No</th>
                          <th className="pb-2 font-medium w-28">Tanggal</th>
                          <th className="pb-2 font-medium text-right w-32">Obat</th>
                          <th className="pb-2 font-medium text-right w-32">Jasa Medis</th>
                          <th className="pb-2 font-medium text-right w-32">Total</th>
                          <th className="pb-2 font-medium text-center w-24">Status</th>
                          <th className="pb-2 font-medium text-center w-32">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-50 dark:divide-gray-800/50">
                        {pasien.transaksi.map((t, i) => (
                          <tr key={t.id} className="text-gray-600 dark:text-gray-300 hover:bg-gray-50/50 dark:hover:bg-gray-700/20 transition-colors">
                            <td className="py-3">{i + 1}</td>
                            <td className="py-3 font-medium text-gray-900 dark:text-gray-100 whitespace-nowrap">{formatTanggalPendek(t.created_at)}</td>
                            <td className="py-3 text-right whitespace-nowrap">{formatRupiah(hitungTotalObat(t))}</td>
                            <td className="py-3 text-right whitespace-nowrap">{formatRupiah(t.jasa_medis ?? 0)}</td>
                            <td className="py-3 text-right font-bold text-green-600 whitespace-nowrap">{formatRupiah(t.total_tarif ?? 0)}</td>
                            <td className="py-3 text-center">
                              {t.status === "lunas" ? (
                                <span className="px-2 py-0.5 text-[10px] font-bold text-green-700 bg-green-100 rounded-full whitespace-nowrap">Lunas</span>
                              ) : (
                                <span className="px-2 py-0.5 text-[10px] font-bold text-amber-700 bg-amber-100 rounded-full whitespace-nowrap">Belum</span>
                              )}
                            </td>
                            <td className="py-3 text-center">
                              <div className="inline-flex items-center gap-1.5 whitespace-nowrap">
                                <button 
                                  onClick={() => navigate(`/admin/transaksi/create/${t.pemeriksaan?.id || t.pemeriksaan_id || t.pemeriksaan_idpemeriksaan}`)} 
                                  className={`px-2.5 py-1 text-[11px] font-medium border rounded-md transition-colors ${
                                    t.status === "lunas" 
                                      ? "text-gray-700 bg-gray-50 border-gray-200 hover:bg-gray-100 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600" 
                                      : "text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800/50"
                                  }`}
                                >
                                  {t.status === "lunas" ? "Detail" : "Bayar"}
                                </button>
                                <button onClick={() => setDeleteId(t.id)} className="px-2.5 py-1 text-[11px] font-medium text-red-700 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors">Hapus</button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center text-gray-500">
                Tidak ada data pasien yang cocok dengan pencarian atau filter.
              </div>
            )}
          </div>
        )}

      </div>

      {/* MODAL EXPORT & CETAK */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-md">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 border-b pb-2 dark:border-gray-700">Export / Cetak Laporan</h3>
            
            <div className="space-y-4">
              {/* Format File */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pilih Format</label>
                <div className="flex gap-4 flex-wrap">
                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-green-600 transition-colors">
                    <input type="radio" name="format" value="pdf" checked={exportFormat === "pdf"} onChange={(e) => setExportFormat(e.target.value)} className="w-4 h-4 text-green-600" />
                    Download PDF
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-green-600 transition-colors">
                    <input type="radio" name="format" value="excel" checked={exportFormat === "excel"} onChange={(e) => setExportFormat(e.target.value)} className="w-4 h-4 text-green-600" />
                    Download Excel
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer hover:text-green-600 transition-colors">
                    <input type="radio" name="format" value="cetak" checked={exportFormat === "cetak"} onChange={(e) => setExportFormat(e.target.value)} className="w-4 h-4 text-green-600" />
                    Cetak Langsung
                  </label>
                </div>
              </div>

              {/* Rentang Waktu */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Rentang Waktu</label>
                <select value={exportPeriod} onChange={(e) => setExportPeriod(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow">
                  <option value="semua">Semua Waktu</option>
                  <option value="bulanan">Berdasarkan Bulan & Tahun</option>
                  <option value="tahunan">Berdasarkan Tahun Saja</option>
                </select>
              </div>

              {/* Input Bulan */}
              {exportPeriod === "bulanan" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pilih Bulan</label>
                  <select value={exportMonth} onChange={(e) => setExportMonth(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow">
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
                </div>
              )}

              {/* Input Tahun */}
              {(exportPeriod === "bulanan" || exportPeriod === "tahunan") && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pilih Tahun</label>
                  <input type="number" value={exportYear} onChange={(e) => setExportYear(e.target.value)} className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm dark:bg-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500 transition-shadow" min="2020" max="2100" />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-8">
              <button onClick={() => setShowExportModal(false)} className="px-5 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">Batal</button>
              <button onClick={handleExport} className="px-5 py-2 text-sm font-semibold text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm">Lanjutkan</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
           <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm">
             <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Hapus Transaksi?</h3>
             <p className="text-sm text-gray-500 mb-4">Apakah Anda yakin ingin menghapus data transaksi ini secara permanen?</p>
             <div className="flex justify-end gap-3 mt-4">
               <button onClick={() => setDeleteId(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">Batal</button>
               <button onClick={() => handleDelete(deleteId)} className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700">Ya, Hapus</button>
             </div>
           </div>
        </div>
      )}
    </section>
  );
}