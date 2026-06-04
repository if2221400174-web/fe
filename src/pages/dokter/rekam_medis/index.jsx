import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { getRekamMedis } from "../../../_sevices/rekamMedis";
import { userImageStorage } from "../../../_api";

export default function RekamMedisPasienDok() {
  // Ambil parameter pasienId dari URL
  const { pasienId } = useParams();

  // State untuk menyimpan data rekam medis yang ditemukan
  const [rekamMedis, setRekamMedis] = useState(null);

  // State untuk menampilkan loading saat data sedang diambil
  const [loading, setLoading] = useState(true);

  // State untuk melacak accordion pemeriksaan mana yang sedang terbuka
  const [expandedPemeriksaan, setExpandedPemeriksaan] = useState({});

  // Ambil semua data rekam medis saat komponen pertama kali dimuat
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Ambil semua rekam medis dari API
        const data = await getRekamMedis();

        // Cari rekam medis yang pasien_id-nya sesuai dengan URL params
        const found = data.find((rm) => rm.pasien_id === parseInt(pasienId));
        setRekamMedis(found || null);
      } catch (err) {
        console.error(err);
      } finally {
        // Matikan loading setelah proses selesai, baik berhasil maupun gagal
        setLoading(false);
      }
    };
    fetchData();
  }, [pasienId]);

  // Fungsi untuk membuka/menutup accordion pemeriksaan berdasarkan id
  const togglePemeriksaan = (id) => {
    setExpandedPemeriksaan((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Fungsi untuk memformat tanggal ke format Indonesia
  const formatTanggal = (tanggal) => {
    return new Date(tanggal).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Tampilkan spinner saat data masih dimuat
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

  // Destructuring data rekam medis: ambil info pasien dan daftar pemeriksaan
  const { pasien, pemeriksaan } = rekamMedis;

  // Balik urutan pemeriksaan agar yang terbaru tampil paling atas
  const pemeriksaanTerbalik = [...pemeriksaan].reverse();

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6">

        {/* ── Navigasi Breadcrumb ── */}
        <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
          {/* Tautan kembali ke halaman daftar pasien */}
          <Link to="/dokter/pasien" className="hover:text-green-700 dark:hover:text-green-400 transition-colors duration-150">
            Manajemen Pasien
          </Link>
          {/* Ikon pemisah breadcrumb */}
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          {/* Nama pasien sebagai level kedua breadcrumb */}
          <span className="text-gray-900 dark:text-white font-medium truncate">{pasien.nama}</span>
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
          {/* Halaman aktif saat ini */}
          <span className="text-gray-900 dark:text-white font-medium">Rekam Medis</span>
        </nav>

        {/* ── Judul Halaman & Tombol Tambah Pemeriksaan ── */}
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

          {/* Header kartu: judul dan kode rekam medis */}
          <div className="bg-green-700 dark:bg-green-800 px-5 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="w-4 h-4 text-green-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="text-sm font-semibold text-white">Identitas Pasien</span>
            </div>
            {/* Badge kode rekam medis pasien */}
            <span className="text-xs font-mono font-medium text-green-100 bg-white/20 px-2.5 py-1 rounded">
              {pasien.kode_rekammedis}
            </span>
          </div>

          {/* identitas pasien */}
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

          {/* Bar statistik: total pemeriksaan dan tanggal terakhir periksa */}
          <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-3 bg-gray-50 dark:bg-gray-700/20 flex flex-wrap items-center gap-6">
            {/* Total pemeriksaan */}
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">
                Total Pemeriksaan:&nbsp;
                <span className="font-semibold text-gray-900 dark:text-white">{pemeriksaan.length}x</span>
              </span>
            </div>
            {/* Tanggal pemeriksaan terakhir */}
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
        
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
            Riwayat Pemeriksaan
          </h2>
          {/* Badge jumlah total catatan pemeriksaan */}
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full font-medium">
            {pemeriksaan.length} Pemeriksaan
          </span>
        </div>

        {/* Kondisi: jika belum ada pemeriksaan, tampilkan state kosong */}
        {pemeriksaan.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-center py-14">
            <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-semibold text-gray-700 dark:text-white mb-1">Belum Ada Pemeriksaan</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Pasien ini belum memiliki riwayat pemeriksaan.</p>
            {/* Tombol shortcut tambah pemeriksaan pertama */}
            <Link
              to={`/dokter/pemeriksaan/create/${pasienId}`}
              className="inline-flex items-center gap-2 bg-green-700 hover:bg-green-800 text-white text-sm font-medium px-5 py-2.5 rounded-lg transition-all duration-200"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Tambah Pemeriksaan Pertama
            </Link>
          </div>
        ) : (
          // Daftar accordion pemeriksaan (urutan terbaru di atas)
          <div className="space-y-3">
            {pemeriksaanTerbalik.map((p, index) => {
              // Accordion terbuka secara default hanya untuk pemeriksaan pertama (terbaru)
              const isOpen = expandedPemeriksaan[p.id] ?? index === 0;

              // Gabungkan semua obat dari seluruh resep dalam satu pemeriksaan
              const allObat = p.resep.flatMap((r) => r.details);

              // Nomor urut pemeriksaan dari yang terlama (1 = pertama kali periksa)
              const nomorUrut = pemeriksaan.length - index;

              return (
                <div
                  key={p.id}
                  className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden"
                >
                  {/* ── Tombol Header Accordion ── */}
                  <button
                    onClick={() => togglePemeriksaan(p.id)}
                    className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150 text-left gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Lingkaran nomor urut pemeriksaan */}
                      <div className="w-8 h-8 rounded-full bg-green-700 dark:bg-green-800 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-white">{nomorUrut}</span>
                      </div>

                      <div className="min-w-0">
                        {/* Tanggal pemeriksaan */}
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          Pemeriksaan {formatTanggal(p.tanggal_pemeriksaan)}
                        </p>
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                          {/* Nama dokter pemeriksa */}
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Pemeriksa:&nbsp;
                            <span className="font-medium text-gray-700 dark:text-gray-300">{p.user?.username || "—"}</span>
                          </span>
                          <span className="hidden sm:inline text-gray-300 dark:text-gray-600">·</span>
                          {/* Badge jumlah obat atau keterangan tanpa resep */}
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

                    {/* Ikon chevron yang berputar saat accordion terbuka */}
                    <svg
                      className={`w-4 h-4 text-gray-400 transition-transform duration-200 flex-shrink-0 ${isOpen ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* ── Isi Accordion (tampil jika isOpen = true) ── */}
                  {isOpen && (
                    <div className="border-t border-gray-100 dark:border-gray-700">

                      {/* Panel keluhan dan diagnosa — dibagi dua kolom dengan garis pemisah */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-700">
                        <div className="px-5 py-4">
                          <p className="text-xs font-semibold text-gray-900 dark:text-gray-500 uppercase tracking-wider mb-2">
                            Keluhan Pasien
                          </p>
                          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                            {p.keluhan || "—"}
                          </p>
                        </div>
                        <div className="px-5 py-4">
                          <p className="text-xs font-semibold text-gray-900 dark:text-gray-500 uppercase tracking-wider mb-2">
                            Diagnosa
                          </p>
                          <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                            {p.diagnosa || "—"}
                          </p>
                        </div>
                      </div>

                      {/* Catatan dokter — hanya tampil jika ada isinya */}
                      {p.catatan && (
                        <div className="mx-5 mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg px-4 py-3">
                          <p className="text-xs font-medium text-bold text-center text-green-900 dark:text-green-400 uppercase tracking-wider mb-1.5">
                            Catatan Dokter
                          </p>
                          <p className="text-sm text-center text-green-700 dark:text-green-200 leading-relaxed">
                            {p.catatan}
                          </p>
                        </div>
                      )}

                      {/* ── Tabel Resep Obat ── */}
                      <div className="px-5 pb-4">
                        <p className="text-xs font-semibold text-gray-900 dark:text-gray-500 uppercase tracking-wider mb-3">Resep Obat</p>

                        {/* Jika tidak ada obat, tampilkan keterangan */}
                        {allObat.length === 0 ? (
                          <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                            Tidak ada resep obat pada pemeriksaan ini.
                          </p>
                        ) : (
                          // Tabel daftar obat: nomor, nama obat, aturan pakai
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
                                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 capitalize">
                                        {detail.obat?.nama_obat || "—"}
                                      </td>
                                      <td className="px-4 py-3 text-gray-600 dark:text-gray-300 capitalize">
                                        {detail.aturan_pakai || "—"}
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ── Footer: Info Dokter Pemeriksa & Tombol Edit ── */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-700/20 border-t border-gray-100 dark:border-gray-700">

                        {/* Foto, nama, dan role dokter yang melakukan pemeriksaan */}
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-300 dark:border-gray-500">
                            {/* Tampilkan foto dokter jika ada, fallback ke ikon user */}
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
                            <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{p.user?.role || "—"}</p>
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

      {/* CSS tambahan untuk utilitas line-clamp yang belum didukung semua browser */}
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