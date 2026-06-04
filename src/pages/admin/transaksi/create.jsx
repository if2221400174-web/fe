import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getPemeriksaan } from "../../../_sevices/pemeriksaan";
import { createTransaksi, getTransaksi } from "../../../_sevices/transaksi";

const formatRupiah = (angka) =>
  "Rp " + Number(angka).toLocaleString("id-ID");

const formatTanggal = (tanggal) =>
  new Date(tanggal).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
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

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch semua transaksi (GET /transaksi → index())
        // Response backend sudah eager load: pemeriksaan.resep.details.obat
        // sehingga kita bisa ambil data resep langsung dari dalam transaksi
        const allTransaksi = await getTransaksi();
        console.log("allTransaksi:", allTransaksi);
        // Cari transaksi yang sudah ada untuk pemeriksaan ini
        const existingFound = allTransaksi.find(
          (t) => t.pemeriksaan_id === Number(pemeriksaanId)
        );
        console.log("semua field pemeriksaan:", Object.keys(existingFound?.pemeriksaan || {}));
        console.log("full object:", JSON.stringify(existingFound?.pemeriksaan || {}, null, 2));

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

  // ── Hitung total harga obat dari resep ──
  // Struktur eager load backend: pemeriksaan.resep[].details[].obat
  // Nama relasi "details" sesuai dengan yang didefinisikan di model Resep Laravel
  const daftarObat =
    pemeriksaan?.resep?.flatMap((r) =>
      r.details?.map((d) => ({
        ...d,
        nama_obat: d.obat?.nama_obat ?? "—",
        harga_obat: Number(d.obat?.harga_obat ?? 0),
      })) ?? []
    ) ?? [];

  const totalObat = daftarObat.reduce((sum, d) => sum + d.harga_obat, 0);
  const jasaMedisNum = Number(jasaMedis) || 0;
  const totalTarif = totalObat + jasaMedisNum;

  // Nama pasien dari relasi rekam_medis → pasien
  const namaPasien =
    pemeriksaan?.rekam_medis?.pasien?.nama ??
    "—";

  // ── Submit transaksi ──
  const handleSubmit = async () => {
    if (!jasaMedis || jasaMedisNum < 0) {
      setError("Masukkan jasa medis yang valid (minimal Rp 0).");
      return;
    }
    setError("");
    setSaving(true);
    try {
      // POST /transaksi → store() di backend
      // Body: { pemeriksaan_id, jasa_medis }
      // Backend menghitung: total_tarif = jasa_medis + sum(harga_obat dari detail resep)
      await createTransaksi({
        pemeriksaan_id: Number(pemeriksaanId),
        jasa_medis: jasaMedisNum,
      });
      navigate("/admin/transaksi", { replace: true });
    } catch (err) {
      console.error(err);
      // Backend mengembalikan 409 jika transaksi sudah ada (guard di store())
      if (err?.response?.status === 409) {
        setError("Transaksi untuk pemeriksaan ini sudah pernah dibuat.");
      } else {
        setError("Gagal menyimpan transaksi. Coba lagi.");
      }
    } finally {
      setSaving(false);
    }
  };

  // ── Loading ──
  if (loading) {
    return (
      <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Memuat data transaksi...
          </p>
        </div>
      </section>
    );
  }

  // ── Error fatal ──
  if (!pemeriksaan) {
    return (
      <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm font-semibold text-red-500 mb-2">
            {error || "Data tidak ditemukan."}
          </p>
          <Link
            to="/admin/pemeriksaan"
            className="text-xs text-green-700 dark:text-green-400 underline"
          >
            ← Kembali ke Pemeriksaan
          </Link>
        </div>
      </section>
    );
  }

  const sudahBayar = existingTransaksi !== null;

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-2xl mx-auto px-3 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {sudahBayar ? "Detail Transaksi" : "Buat Transaksi"}
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

        {/* ── Badge sudah bayar ── */}
        {sudahBayar && (
          <div className="mb-5 flex items-center gap-2.5 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-xl px-4 py-3">
            <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-800/40 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300">
                Transaksi Berhasil Disimpan
              </p>
              <p className="text-xs text-green-600 dark:text-green-400">
                Total tarif: {formatRupiah(existingTransaksi.total_tarif)}
              </p>
            </div>
          </div>
        )}

        {/* ── Card info pemeriksaan ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-4 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Hasil Pemeriksaan
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-700">
            <div className="px-5 py-4">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Keluhan</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                {pemeriksaan.keluhan || "—"}
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Diagnosa</p>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                {pemeriksaan.diagnosa || "—"}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-4 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Resep Obat
            </p>
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
            <p className="px-5 py-4 text-sm text-gray-400 dark:text-gray-500 italic">
              Tidak ada obat dalam resep.
            </p>
          )}
        </div>

        {/* ── Card rincian biaya ── */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm mb-6 overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/30">
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Rincian Biaya
            </p>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-600 dark:text-gray-300">Total Obat</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {formatRupiah(totalObat)}
              </p>
            </div>
            <div className="flex items-center justify-between gap-4">
              <label htmlFor="jasa_medis" className="text-sm text-gray-600 dark:text-gray-300 flex-shrink-0">
                Jasa Medis
              </label>
              {sudahBayar ? (
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatRupiah(existingTransaksi.jasa_medis)}
                </p>
              ) : (
                <div className="relative w-48">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 dark:text-gray-500 pointer-events-none select-none">
                    Rp
                  </span>
                  <input
                    id="jasa_medis"
                    type="number"
                    min="0"
                    step="1000"
                    placeholder="0"
                    value={jasaMedis}
                    onChange={(e) => setJasaMedis(e.target.value)}
                    className="w-full text-sm text-right rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white pl-9 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
              )}
            </div>
            <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-gray-900 dark:text-white">Total Tarif</p>
                <p className="text-lg font-bold text-green-700 dark:text-green-400">
                  {sudahBayar
                    ? formatRupiah(existingTransaksi.total_tarif)
                    : formatRupiah(totalTarif)}
                </p>
              </div>
              {!sudahBayar && (
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 text-right">
                  Total Obat + Jasa Medis
                </p>
              )}
            </div>
          </div>
        </div>

        {/* ── Error ── */}
        {error && (
          <div className="mb-4 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-lg">
            <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* ── Aksi ── */}
        <div className="flex items-center justify-between gap-3">
          <Link
            to="/admin/pemeriksaan"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-green-600 dark:text-green-300 border border-green-200 dark:border-green-600 rounded-lg hover:bg-green-100 dark:hover:bg-green-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Pemeriksaan
          </Link>
          <Link
            to="/admin/transaksi"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-green-600 dark:text-green-300 border border-green-200 dark:border-green-600 rounded-lg hover:bg-green-100 dark:hover:bg-green-700 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
            </svg>
            Transaksi
          </Link>

          {/* Tombol konfirmasi hanya muncul jika transaksi belum ada */}
          {!sudahBayar && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={saving}
              className="inline-flex items-center gap-2 px-6 py-2 text-sm font-semibold text-white bg-green-700 hover:bg-green-800 dark:bg-green-700 dark:hover:bg-green-600 rounded-lg transition-colors disabled:opacity-60 shadow-sm"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Konfirmasi
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </section>
  );
}