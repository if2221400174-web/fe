import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { deleteObat, getObat } from "../../../_sevices/obat";

export default function AdminObat() {
  const [obats, setObats] = useState([]);
  const [openDropdownId, setOpenDropdwnId] = useState(null);
  const [viewMode, setViewMode] = useState("card");
  const [searchQuery, setSearchQuery] = useState("");

  const toggleDropdwn = (id) => {
    setOpenDropdwnId(openDropdownId === id ? null : id);
  };

  useEffect(() => {
    const fetchData = async () => {
      const [usersData] = await Promise.all([getObat()]);
      setObats(usersData);
    };
    fetchData();
  }, []);

  // Fungsi inisial dari nama obat — dipanggil per item, bukan dari localStorage
  const getObatInitial = (nama_obat) => {
    if (!nama_obat) return "?";
    return nama_obat.charAt(0).toUpperCase();
  };

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Yakin ingin menghapus obat ini?");
    if (confirmDelete) {
      await deleteObat(id);
      setObats(obats.filter((obat) => obat.id !== id));
    }
  };

  const filteredObats = obats.filter((obat) =>
    obat.nama_obat?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Format harga ke rupiah
  const formatHarga = (harga) => {
    if (!harga) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(harga);
  };

  return (
    <>
      <section className="bg-gray-50 dark:bg-gray-900 min-h-screen">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 text-center sm:text-left">
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Manajemen Obat
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Kelola daftar obat di Praktek Umum Mandiri Dr. Rowi
            </p>
          </div>

          {/* Sub Header */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4 mb-6">
            <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
              {/* Form Pencarian */}
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
                    placeholder="Cari nama obat..."
                  />
                </div>
              </div>

              {/* pemilihan tampilan data antara card dan tabel */}
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
                  to={"/admin/obat/create"}
                  className="flex items-center justify-center gap-2 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg text-sm px-4 py-2.5 transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-[1.02] active:scale-[0.98] flex-1 sm:flex-initial"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                  </svg>
                  <span>Tambah</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Sajian Data */}
          {viewMode === "card" ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredObats.length > 0 ? (
                filteredObats.map((obat) => (
                  <div
                    key={obat.id}
                    className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group"
                  >
                    {/* Card Header dengan gradient */}
                    <div className="relative h-16 bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      {/* Action Dropdown */}
                      <div className="absolute top-3 right-3">
                        <div className="relative">
                          <button
                            onClick={() => toggleDropdwn(obat.id)}
                            className="p-2 bg-white/90 dark:bg-green-700/90 backdrop-blur-sm rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 shadow-md"
                          >
                            <svg className="w-5 h-5 text-gray-700 dark:text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                            </svg>
                          </button>

                          {openDropdownId === obat.id && (
                            <div className="absolute right-0 mt-2 w-35 bg-white dark:bg-gray-700 rounded-lg shadow-xl border border-gray-200 dark:border-gray-600 z-50 animate-fadeIn">
                              <div className="py-1">
                                <Link
                                  to={`/admin/obat/edit/${obat.id}`}
                                  className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-600 transition-colors duration-150"
                                  onClick={() => setOpenDropdwnId(null)}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </Link>
                                <button
                                  onClick={() => {
                                    handleDelete(obat.id);
                                    setOpenDropdwnId(null);
                                  }}
                                  className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors duration-150"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                  Hapus
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-5 text-center">
                      {/* Avatar Inisial — diambil dari nama_obat tiap item */}
                      <div className={`w-20 h-20 rounded-full inline-flex items-center justify-center border-4 border-green-100 shadow-md group-hover:scale-110 transition-transform duration-300 -mt-10 relative z-10 ${(obat.nama_obat)}`}>
                        <span className="text-gray-900 font-bold text-2xl">
                          {getObatInitial(obat.nama_obat)}
                        </span>
                      </div>

                      {/* Nama Obat */}
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mt-3 mb-1 truncate uppercase">
                        {obat.nama_obat}
                      </h3>

                      {/* Harga */}
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-700 mb-2">
                        <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                          {formatHarga(obat.harga_obat)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-full text-center py-16">
                  <svg className="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Tidak ada obat
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                    {searchQuery ? "Tidak ada hasil yang sesuai dengan pencarian" : "Belum ada obat yang terdaftar"}
                  </p>
                  {!searchQuery && (
                    <Link
                      to="/admin/obat/create"
                      className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg text-sm px-6 py-3 transition-all duration-200"
                    >
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                      </svg>
                    Tambah
                    </Link>
                  )}
                </div>
              )}
            </div>
          ) : (
            // Table View
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
                  <thead className="text-sm text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                    <tr>
                      <th scope="col" className="px-6 py-4">Nama Obat</th>
                      <th scope="col" className="px-6 py-4">Harga</th>
                      <th scope="col" className="px-6 py-4">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredObats.length > 0 ? (
                      filteredObats.map((obat) => (
                        <tr
                          key={obat.id}
                          className="border-b"
                        >
                          {/* Nama obat dengan inisial avatar di table view */}
                          <td className="px-6 py-1 text-sm text-gray-900 dark:text-white">
                            <div className="flex items-center gap-3">
                              {obat.nama_obat}
                            </div>
                          </td>
                          <td className="px-6 py-1 text-sm text-gray-900 dark:text-white">
                            {formatHarga(obat.harga_obat)}
                          </td>
                          <td className="px-6 py-1 relative">
                            <button
                              onClick={() => toggleDropdwn(obat.id)}
                              className="inline-flex items-center p-2 text-sm font-medium text-center text-gray-500 hover:text-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none dark:text-gray-400 dark:hover:text-gray-100 transition-all duration-150"
                              type="button"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M6 10a2 2 0 11-4 0 2 2 0 014 0zM12 10a2 2 0 11-4 0 2 2 0 014 0zM16 12a2 2 0 100-4 2 2 0 000 4z" />
                              </svg>
                            </button>

                            {openDropdownId === obat.id && (
                              <div
                                className="absolute right-0 mt-2 z-10 w-48 bg-white rounded-lg shadow-xl border border-gray-200 dark:bg-gray-700 dark:border-gray-600 animate-fadeIn"
                                style={{ top: "100%", right: "0" }}
                              >
                                <div className="py-1">
                                  <Link
                                    to={`/admin/obat/edit/${obat.id}`}
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 dark:text-gray-200 dark:hover:bg-gray-600 transition-colors duration-150"
                                    onClick={() => setOpenDropdwnId(null)}
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                    </svg>
                                    Edit
                                  </Link>
                                  <button
                                    onClick={() => {
                                      handleDelete(obat.id);
                                      setOpenDropdwnId(null);
                                    }}
                                    className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors duration-150"
                                  >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Hapus
                                  </button>
                                </div>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="text-center py-12 text-gray-500 dark:text-gray-400">
                          <div className="flex flex-col items-center">
                            <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="text-lg font-medium">
                              {searchQuery ? "Tidak ada hasil yang sesuai" : "Data tidak ditemukan"}
                            </p>
                            <Link
                              to="/admin/obat/create"
                              className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white font-medium rounded-lg text-sm px-6 py-3 transition-all duration-200"
                            >
                              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 15">
                                <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
                              </svg>
                            Tambah
                            </Link>
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

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </>
  );
}