import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { toPng } from "html-to-image";
import { deletePasien, getPasien } from "../../../_sevices/pasien";

// Ubah di sini kalau ada informasi klinik yang perlu dikoreksi
const KLINIK_INFO = {
  namaKlinik: "PRAKTEK DOKTER UMUM",
  namaDokter: "dr. Rowi",
  sip: "SIP. No. 503/185/SIPD/X/2023",
  alamat: "Kec. Guluk-Guluk, Kab. Sumenep, Jawa Timur",
};

export default function AdminPasien() {
  const [pasien, setPasien] = useState([]);
  const [viewMode, setViewMode] = useState("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [cardPasien, setCardPasien] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const kartuRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      const pasienData = await getPasien();
      const sorted = [...pasienData].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );
      setPasien(sorted);
    };
    fetchData();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Yakin ingin menghapus pasien ini?");
    if (confirmDelete) {
      await deletePasien(id);
      setPasien(pasien.filter((p) => p.id !== id));
    }
  };

  const handleOpenKartu = (patient) => setCardPasien(patient);
  const handleCloseKartu = () => setCardPasien(null);

  const handleDownloadGambar = async () => {
    if (!kartuRef.current) return;
    setIsDownloading(true);

    try {
      const dataUrl = await toPng(kartuRef.current, {
        cacheBust: true,
        pixelRatio: 3, // Sama seperti scale: 3 di html2canvas
        backgroundColor: null,
      });

      const link = document.createElement("a");
      link.download = `kartu-berobat-${(cardPasien?.nama || "pasien")
        .toLowerCase()
        .replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Gagal membuat gambar kartu:", error);
      alert("Gagal membuat gambar kartu. Silakan coba lagi.");
    } finally {
      setIsDownloading(false);
    }
  };

  const filteredPasien = pasien.filter(
    (p) =>
      p.nama?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.kode_rekammedis?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <section className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">

          <div className="mb-6 text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Manajemen Pasien
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Kelola daftar pasien Praktek Dokter Umum dr. Rowi
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              <div className="w-full lg:w-96">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm text-gray-900 dark:text-white transition-all duration-200"
                    placeholder="Cari nama pasien atau kode rekam medis..."
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 w-full lg:w-auto">
                <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode("card")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                      viewMode === "card"
                        ? "bg-white dark:bg-gray-600 text-green-700 dark:text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M3 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 12a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H4a1 1 0 01-1-1v-4zM11 4a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V4zM11 12a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => setViewMode("table")}
                    className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 ${
                      viewMode === "table"
                        ? "bg-white dark:bg-gray-600 text-green-700 dark:text-white shadow-sm"
                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>

                <Link
                  to={"/admin/pasien/create"}
                  className="flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg text-sm px-4 py-2.5 transition-all duration-200 shadow-md hover:shadow-lg flex-1 sm:flex-initial"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  <span>Tambah</span>
                </Link>
              </div>
            </div>
          </div>

          {viewMode === "card" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
              {filteredPasien.length > 0 ? (
                filteredPasien.map((p) => (
                  <div
                    key={p.id}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:border-green-300 dark:hover:border-blue-600 hover:shadow-md transition-all duration-200 flex flex-col"
                  >
                    <div className="bg-green-700 dark:bg-green-800 px-3 py-2 text-center">
                      <span className="text-xs font-medium text-green-100 bg-white/20 px-2 py-0.5 rounded truncate max-w-[80%] inline-block">
                        {p.kode_rekammedis || "—"}
                      </span>
                    </div>
                    <div className="px-2 pt-1 pb-0 flex-1">
                      <h3 className="text-xs font-semibold text-gray-900 dark:text-white text-center truncate uppercase tracking-wide mb-1">
                        {p.nama}
                      </h3>
                      <div className="border-t border-gray-100 dark:border-gray-700 mb-2" />
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-start gap-2">
                          <svg className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-xs text-gray-600 dark:text-gray-300 leading-tight line-clamp-2 capitalize">
                            {p.alamat || "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            {p.tanggal_lahir || "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            {p.umur ? `${p.umur} Tahun` : "—"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                            {p.jenis_kelamin || "—"}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Rekam Medis & Pemeriksaan — tetap stacked seperti semula */}
                    <div className="px-3 pb-2 flex flex-col gap-1.5">
                      <Link
                        to={`/admin/rekam-medis/${p.id}`}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-300 dark:bg-green-900/30 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-md transition-colors duration-150"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Rekam Medis
                      </Link>
                    </div>

                    {/* Edit, Kartu, Hapus — tiga kolom sejajar */}
                    <div className="border-t border-gray-100 dark:border-gray-700 flex">
                      <Link
                        to={`/admin/pasien/edit/${p.id}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors duration-150 border-r border-gray-100 dark:border-gray-700"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </Link>
                      <button
                        onClick={() => handleOpenKartu(p)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors duration-150 border-r border-gray-100 dark:border-gray-700"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                        </svg>
                        Kartu
                      </button>
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Hapus
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Tidak ada pasien ditemukan</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {searchQuery ? "Tidak ada hasil yang sesuai dengan pencarian" : "Belum ada pasien yang terdaftar"}
                  </p>
                  {!searchQuery && (
                    <Link
                      to="/admin/pasien/create"
                      className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg text-sm px-6 py-3 transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                      </svg>
                      Tambah Pasien
                    </Link>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table
                  className="text-sm text-left text-gray-500 dark:text-gray-400"
                  style={{ minWidth: "980px", width: "100%", tableLayout: "fixed" }}
                >
                  <colgroup>
                    <col style={{ width: "170px" }} />
                    <col style={{ width: "140px" }} />
                    <col style={{ width: "200px" }} />
                    <col style={{ width: "80px" }} />
                    <col style={{ width: "100px" }} />
                    <col style={{ width: "260px" }} />
                  </colgroup>
                  <thead className="text-sm text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-4 py-4 font-semibold">Nama Pasien</th>
                      <th scope="col" className="px-4 py-4 font-semibold">Kode RM</th>
                      <th scope="col" className="px-4 py-4 font-semibold">Alamat</th>
                      <th scope="col" className="px-4 py-4 font-semibold">Umur</th>
                      <th scope="col" className="px-4 py-4 font-semibold">Kelamin</th>
                      <th scope="col" className="px-4 py-4 font-semibold">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPasien.length > 0 ? (
                      filteredPasien.map((p) => (
                        <tr key={p.id} className="border-b dark:border-gray-700 align-middle">
                          <td className="px-4 py-3">
                            <div className="overflow-x-auto scrollbar-thin" style={{ maxWidth: "100%" }}>
                              <span className="block text-sm text-gray-900 dark:text-white whitespace-nowrap">
                                {p.nama}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="overflow-x-auto scrollbar-thin" style={{ maxWidth: "100%" }}>
                              <span className="block text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap uppercase">
                                {p.kode_rekammedis || "—"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-1">
                            <div className="overflow-x-auto scrollbar-thin" style={{ maxWidth: "100%" }}>
                              <span className="block text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap capitalize">
                                {p.alamat || "—"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-1">
                            <span className="block text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">
                              {p.umur ? `${p.umur} Th` : "—"}
                            </span>
                          </td>
                          <td className="px-4 py-1">
                            <span className="inline-flex items-center text-xs px-2 py-1 rounded-full whitespace-nowrap bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                              {p.jenis_kelamin || "—"}
                            </span>
                          </td>
                          <td className="px-4 py-1">
                            <div className="flex items-center gap-1.5 flex-nowrap">
                              <Link
                                to={`/admin/rekam-medis/${p.id}`}
                                title="Lihat Rekam Medis"
                                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-300 dark:bg-green-900/30 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-md transition-colors duration-150 whitespace-nowrap"
                              >
                                <svg className="w-3.5 h-3.5 flex-shrink-0 hidden sm:inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                <span>RM</span>
                              </Link>
                              <Link
                                to={`/admin/pemeriksaan/create/${p.id}`}
                                title="Tambah Pemeriksaan"
                                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-300 dark:bg-green-900/30 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-md transition-colors duration-150 whitespace-nowrap"
                              >
                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                                </svg>
                                <span className="hidden sm:inline">Periksa</span>
                              </Link>
                              <Link
                                to={`/admin/pasien/edit/${p.id}`}
                                title="Edit Pasien"
                                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800 rounded-md transition-colors duration-150"
                              >
                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </Link>
                              <button
                                onClick={() => handleOpenKartu(p)}
                                title="Kartu Berobat"
                                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 border border-purple-200 dark:border-purple-800 rounded-md transition-colors duration-150"
                              >
                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(p.id)}
                                title="Hapus Pasien"
                                className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800 rounded-md transition-colors duration-150"
                              >
                                <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-12 text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-lg font-medium">
                              {searchQuery ? "Tidak ada hasil yang sesuai" : "Data tidak ditemukan"}
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* MODAL PREVIEW KARTU BEROBAT */}
      {cardPasien && (
        <div className="kartu-modal-overlay" onClick={handleCloseKartu}>
          <div className="kartu-modal-box" onClick={(e) => e.stopPropagation()}>
            <div className="kartu-modal-head">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                Pratinjau Kartu Berobat
              </h3>
              <button
                onClick={handleCloseKartu}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* KARTU — kembali ke kode asli */}
            <div className="kartu-pasien" ref={kartuRef}>
              <div className="kartu-wave-top" />
              <div className="kartu-wave-bottom" />

              <div className="kartu-content">
                <div className="kartu-header">
                  <div className="kartu-header-text">
                    <p className="kartu-nama-klinik">{KLINIK_INFO.namaKlinik}</p>
                    <p className="kartu-nama-dokter">{KLINIK_INFO.namaDokter}</p>
                    <p className="kartu-sip">{KLINIK_INFO.sip}</p>
                    <p className="kartu-alamat-klinik">{KLINIK_INFO.alamat}</p>
                  </div>
                  <div className="kartu-logo">
                    <svg viewBox="0 0 24 24" fill="none" className="kartu-logo-icon">
                      <path
                        d="M12 2a2 2 0 012 2v6h6a2 2 0 012 2v0a2 2 0 01-2 2h-6v6a2 2 0 01-2 2v0a2 2 0 01-2-2v-6H4a2 2 0 01-2-2v0a2 2 0 012-2h6V4a2 2 0 012-2z"
                        fill="#15803d"
                      />
                    </svg>
                  </div>
                </div>

                <div className="kartu-badge">KARTU BEROBAT</div>

                <div className="kartu-fields">
                  <div className="kartu-field-row">
                    <span className="kartu-field-label">No. RM</span>
                    <span className="kartu-field-colon">:</span>
                    <span className="kartu-field-value">{cardPasien.kode_rekammedis || "-"}</span>
                  </div>
                  <div className="kartu-field-row">
                    <span className="kartu-field-label">Nama</span>
                    <span className="kartu-field-colon">:</span>
                    <span className="kartu-field-value kartu-field-value-bold">{cardPasien.nama || "-"}</span>
                  </div>
                  <div className="kartu-field-row">
                    <span className="kartu-field-label">Tanggal Lahir</span>
                    <span className="kartu-field-colon">:</span>
                    <span className="kartu-field-value">{cardPasien.tanggal_lahir || "-"}</span>
                  </div>
                  <div className="kartu-field-row">
                    <span className="kartu-field-label">Jenis Kelamin</span>
                    <span className="kartu-field-colon">:</span>
                    <span className="kartu-field-value">{cardPasien.jenis_kelamin || "-"}</span>
                  </div>
                  <div className="kartu-field-row">
                    <span className="kartu-field-label">Alamat</span>
                    <span className="kartu-field-colon">:</span>
                    <span className="kartu-field-value kartu-field-value-kecil">{cardPasien.alamat || "-"}</span>
                  </div>
                </div>

                <div className="kartu-footer">Kartu harap dibawa setiap kali berobat</div>
              </div>
            </div>

            <div className="kartu-modal-actions">
              <button
                onClick={handleDownloadGambar}
                disabled={isDownloading}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-green-700 hover:bg-green-800 rounded-lg disabled:opacity-60 transition-all duration-200"
              >
                {isDownloading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Membuat gambar...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Unduh Gambar
                  </>
                )}
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
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }
        .scrollbar-thin::-webkit-scrollbar { height: 3px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 9999px;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb:hover { background-color: #9ca3af; }
        .dark .scrollbar-thin { scrollbar-color: #4b5563 transparent; }
        .dark .scrollbar-thin::-webkit-scrollbar-thumb { background-color: #4b5563; }
        .dark .scrollbar-thin::-webkit-scrollbar-thumb:hover { background-color: #6b7280; }

        /* ===== MODAL PRATINJAU KARTU ===== */
        .kartu-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.55);
          backdrop-filter: blur(2px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
          padding: 16px;
        }
        .kartu-modal-box {
          background: #fff;
          border-radius: 16px;
          padding: 20px;
          width: 100%;
          max-width: 430px;
          box-shadow: 0 20px 50px rgba(0,0,0,0.25);
        }
        .kartu-modal-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
        }
        .kartu-modal-actions {
          margin-top: 18px;
        }

        /* ===== DESAIN KARTU BEROBAT ===== */
        .kartu-pasien {
          position: relative;
          width: 100%;
          aspect-ratio: 8 / 5;
          border-radius: 14px;
          overflow: hidden;
          background: #ffffff;
          box-shadow: 0 8px 20px rgba(21, 128, 61, 0.15);
          font-family: 'Segoe UI', Arial, sans-serif;
        }
        .kartu-wave-top {
          position: absolute;
          top: -18%;
          left: -18%;
          width: 65%;
          height: 75%;
          background: linear-gradient(135deg, #15803d 0%, #22c55e 55%, #86efac 100%);
          clip-path: polygon(0 0, 100% 0, 45% 65%, 15% 100%, 0 100%);
          z-index: 0;
        }
        .kartu-wave-bottom {
          position: absolute;
          bottom: -10%;
          left: -8%;
          width: 116%;
          height: 22%;
          background: linear-gradient(90deg, #15803d, #4ade80);
          border-radius: 100% 100% 0 0 / 100% 100% 0 0;
          z-index: 0;
        }
        .kartu-content {
          position: relative;
          z-index: 1;
          height: 100%;
          padding: 14px 16px 10px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
        }
        .kartu-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 8px;
        }
        .kartu-nama-klinik {
          margin: 0;
          font-size: 10.5px;
          font-weight: 700;
          letter-spacing: 0.4px;
          color: #14532d;
        }
        .kartu-nama-dokter {
          margin: 1px 0 0;
          font-size: 9.5px;
          font-weight: 600;
          color: #1f2937;
        }
        .kartu-sip {
          margin: 2px 0 0;
          font-size: 6.5px;
          color: #4b5563;
        }
        .kartu-alamat-klinik {
          margin: 1px 0 0;
          font-size: 6.5px;
          color: #4b5563;
        }
        .kartu-logo {
          flex-shrink: 0;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          background: #ffffff;
          border: 1.5px solid #16a34a;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 4px rgba(0,0,0,0.08);
        }
        .kartu-logo-icon {
          width: 14px;
          height: 14px;
        }
        .kartu-badge {
          align-self: flex-start;
          margin-top: 6px;
          font-size: 7px;
          font-weight: 700;
          letter-spacing: 0.5px;
          color: #ffffff;
          background: linear-gradient(90deg, #f59e0b, #fb923c);
          padding: 3px 9px;
          border-radius: 999px;
        }
        .kartu-fields {
          margin-top: 8px;
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .kartu-field-row {
          display: flex;
          align-items: baseline;
          gap: 4px;
          font-size: 9px;
        }
        .kartu-field-label {
          width: 78px;
          flex-shrink: 0;
          font-weight: 600;
          color: #374151;
        }
        .kartu-field-colon {
          color: #374151;
        }
        .kartu-field-value {
          flex: 1;
          color: #111827;
          border-bottom: 1px dotted #d1d5db;
          padding-bottom: 1px;
        }
        .kartu-field-value-bold {
          font-weight: 700;
          text-transform: uppercase;
        }
        .kartu-field-value-kecil {
          font-size: 8px;
          text-transform: capitalize;
          line-height: 1.3;
        }
        .kartu-footer {
          text-align: center;
          font-size: 6px;
          font-style: italic;
          color: #6b7280;
          margin-top: 6px;
        }
      `}</style>
    </>
  );
}