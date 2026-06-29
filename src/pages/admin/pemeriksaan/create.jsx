import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createPemeriksaan } from "../../../_sevices/pemeriksaan";
import { getRekamMedis } from "../../../_sevices/rekamMedis";

export default function CreatePemeriksaan() {
  const { pasienId } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    tanggal_pemeriksaan: "",
    keluhan: "",
    diagnosa: "",
    catatan: "",
  });

  // rekam_medis_id diambil otomatis berdasarkan pasienId dari URL
  const [rekamMedisId, setRekamMedisId] = useState(null);
  const [loadingRekamMedis, setLoadingRekamMedis] = useState(true);
  const [errorRekamMedis, setErrorRekamMedis] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Ambil rekam_medis_id milik pasien ini saat komponen mount
  useEffect(() => {
    const fetchRekamMedis = async () => {
      try {
        const data = await getRekamMedis();
        const found = data.find((rm) => rm.pasien_id === parseInt(pasienId));
        if (found) {
          setRekamMedisId(found.id);
        } else {
          setErrorRekamMedis("Rekam medis untuk pasien ini tidak ditemukan.");
        }
      } catch (err) {
        console.error(err);
        setErrorRekamMedis("Gagal memuat data rekam medis.");
      } finally {
        setLoadingRekamMedis(false);
      }
    };
    fetchRekamMedis();
  }, [pasienId]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!rekamMedisId) {
      setFormError("Rekam medis tidak ditemukan. Tidak dapat menyimpan pemeriksaan.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      await createPemeriksaan({
        rekam_medis_id: rekamMedisId,
        tanggal_pemeriksaan: formData.tanggal_pemeriksaan,
        keluhan: formData.keluhan,
        diagnosa: formData.diagnosa,
        catatan: formData.catatan,
      });
      navigate("/admin/pemeriksaan");
    } catch (error) {
      const errors = error.response?.data?.errors;
      if (error.response?.status === 422 && errors) {
        // Ambil pesan validasi pertama dengan aman
        const firstError = Object.values(errors)?.[0]?.[0];
        setFormError(firstError ?? "Data tidak valid.");
      } else {
        setFormError("Terjadi kesalahan sistem. Coba lagi.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({ tanggal_pemeriksaan: "", keluhan: "", diagnosa: "", catatan: "" });
    setFormError("");
  };

  // ── Loading rekam medis ──
  if (loadingRekamMedis) {
    return (
      <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Memuat data pasien...</p>
        </div>
      </section>
    );
  }

  // ── Rekam medis tidak ditemukan ──
  if (errorRekamMedis) {
    return (
      <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-sm text-red-500 dark:text-red-400 mb-4">{errorRekamMedis}</p>
          <button
            onClick={() => navigate("/admin/pemeriksaan")}
            className="text-sm text-green-700 dark:text-green-400 underline"
          >
            Kembali ke daftar pemeriksaan
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-2xl px-4 py-6 mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              Tambah Pemeriksaan
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tambahkan data pemeriksaan ke daftar
            </p>
          </div>
          <button
            onClick={() => navigate("/admin/pemeriksaan")}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Kembali
          </button>
        </div>

        <form onSubmit={handleSubmit} onReset={handleReset}>
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-6 space-y-6">

              {/* Info Box */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-center text-green-900 dark:text-green-300 mb-1">
                      Tambah Pemeriksaan Baru
                    </h3>
                    <p className="text-sm text-center text-green-800 dark:text-green-400">
                      Pastikan data pemeriksaan sudah benar sebelum menyimpan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Error form */}
              {formError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
                  <p className="text-sm text-red-700 dark:text-red-400">{formError}</p>
                </div>
              )}
              <div>
                <label htmlFor="tanggal_pemeriksaan" className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Tanggal Pemeriksaan
                </label>
                <input
                  type="date"
                  name="tanggal_pemeriksaan"
                  id="tanggal_pemeriksaan"
                  value={formData.tanggal_pemeriksaan}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                  required
                />
              </div>
              <div>
                <label htmlFor="keluhan" className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Keluhan
                </label>
                <input
                  type="text"
                  name="keluhan"
                  id="keluhan"
                  value={formData.keluhan}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                  placeholder="cth. Pusing, Mual, Demam"
                  required
                />
              </div>
              <div>
                <label htmlFor="diagnosa" className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Diagnosa
                </label>
                <input
                  type="text"
                  name="diagnosa"
                  id="diagnosa"
                  value={formData.diagnosa}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                  placeholder="cth. Migrain, Demam Berdarah"
                  required
                />
              </div>
              <div>
                <label htmlFor="catatan" className="block text-sm font-semibold text-gray-900 dark:text-white mb-1">
                  Catatan Edukasi
                </label>
                <input
                  type="text"
                  name="catatan"
                  id="catatan"
                  value={formData.catatan}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                  placeholder="cth. perlu kontrol ulang, pantau suhu tubuh, dll"
                />
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-between gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              <button
                type="reset"
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Reset
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 dark:bg-green-700 dark:hover:bg-green-800 transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-60"
              >
                {submitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Simpan
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </section>
  );
}