import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteTransaksi, getTransaksi } from "../../../_sevices/transaksi";


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

  // Hitung total harga obat per transaksi dari nested resep → details → obat
  const hitungTotalObat = (t) => {
    const obatList =
      t.pemeriksaan?.resep?.flatMap((r) =>
        r.details?.map((d) => Number(d.obat?.harga_obat ?? 0)) ?? []
      ) ?? [];
    return obatList.reduce((sum, h) => sum + h, 0);
  };


  if (loading) {
    return (
      <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Memuat riwayat transaksi...
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-6">

        {/* Judul */}
        <div className="mb-6 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            Riwayat Transaksi
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Transaksi pembayaran Praktek Umum Mandiri Dr. Rowi
          </p>
        </div>
        <div className="flex flex-items justify-between flex-row sm:items-center gap-3 mb-4">
          <span className="text-md text-gray-900 dark:text-gray-400 px-2.5 py-1 rounded-full font-medium flex-shrink-0">
            Semua Transaksi
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full font-medium flex-shrink-0">
            {transaksiList.length} Transaksi
          </span>
        </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left" style={{ minWidth: "900px" }}>
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-10">
                      No.
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider whitespace-nowrap">
                      Tanggal
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Nama Pasien
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">
                      Harga Obat
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">
                      Jasa Medis
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right whitespace-nowrap">
                      Total Tarif
                    </th>
                    <th className="px-4 py-3 text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider text-center whitespace-nowrap">
                      Aksi
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {transaksiList.map((t, i) => {
                    const namaPasien =
                      t.pemeriksaan?.rekam_medis?.pasien?.nama ?? "—";
                    const totalObat = hitungTotalObat(t);

                    return (
                      <tr
                        key={t.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                      >
                        {/* No */}
                        <td className="px-4 py-3.5 text-sm text-gray-400 dark:text-gray-500 font-medium">
                          {i + 1}
                        </td>

                        {/* Tanggal */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="text-sm font-medium text-gray-900 dark:text-white">
                            {formatTanggalPendek(t.created_at)}
                          </span>
                        </td>

                        {/* Nama Pasien */}
                        <td className="px-4 py-3.5 whitespace-nowrap">
                          <span className="font-semibold text-sm text-gray-900 dark:text-white">
                            {namaPasien}
                          </span>
                        </td>

                        {/* Harga Obat */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {formatRupiah(totalObat)}
                          </span>
                        </td>

                        {/* Jasa Medis */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {formatRupiah(t.jasa_medis ?? 0)}
                          </span>
                        </td>

                        {/* Total Tarif */}
                        <td className="px-4 py-3.5 text-right whitespace-nowrap">
                          <span className="text-sm font-bold text-green-700 dark:text-green-400">
                            {formatRupiah(t.total_tarif ?? 0)}
                          </span>
                        </td>

                        {/* Aksi: Edit & Hapus */}
                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Tombol Edit */}
                            <button
                              onClick={() =>
                                navigate(`/admin/transaksi/create/${t.id}`)
                              }
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-md hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                              </svg>
                              Detail
                            </button>

                            {/* Tombol Hapus */}
                            <button
                              onClick={() => setDeleteId(t.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-md hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m2 0a1 1 0 00-1-1h-4a1 1 0 00-1 1H5" />
                              </svg>
                              Hapus
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
      </div>

      {/* Modal Konfirmasi Hapus */}
      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Hapus Transaksi?
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Data transaksi ini akan dihapus permanen dan tidak bisa dikembalikan.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                className="px-4 py-2 text-xs font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}