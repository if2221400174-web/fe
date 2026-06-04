import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createObat } from "../../../_sevices/obat";

export default function CreateObat() {
  const [formData, setFormData] = useState({
    nama_obat: "",
    harga_obat: "",
  });

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  const dataToSend = new FormData();
  dataToSend.append("nama_obat", formData.nama_obat);
  dataToSend.append("harga_obat", formData.harga_obat);

  try {
    await createObat(dataToSend);
    navigate("/admin/obat");
  } catch (error) {
    if (error.response?.status === 422) {
      const errors = error.response.data.errors;
      alert("Gagal: " + Object.values(errors)[0][0]);
    } else {
      alert("Terjadi kesalahan sistem.");
    }
  }
};

  const handleReset = () => {
    setFormData({ nama_obat: "", harga_obat: "" });
  };

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-2xl px-4 py-6 mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Form Tambah Obat</h2>
          </div>
          <button
            onClick={() => navigate("/admin/obat")}
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
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex flex-col items-center justify-center">
                <div className="flex gap-3">
                  <div>
                    <h3 className="text-sm font-semibold text-center text-green-900 dark:text-green-300 mb-1">
                      Tambah Obat Baru
                    </h3>
                    <p className="text-sm text-center text-green-800 dark:text-green-400">
                      Pastikan nama obat dan harga sudah benar sebelum menyimpan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Nama Obat */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v1h16V4a1 1 0 00-1-1H3zm0 4v9a2 2 0 002 2h10a2 2 0 002-2V7H3zm7 2a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1H8a1 1 0 110-2h1V9a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <label htmlFor="nama_obat" className="block text-sm font-semibold text-gray-900 dark:text-white">
                      Nama Obat
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nama lengkap obat beserta dosis</p>
                  </div>
                </div>
                <input
                  type="text"
                  name="nama_obat"
                  id="nama_obat"
                  value={formData.nama_obat}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                  placeholder="cth. Paracetamol 500mg"
                  required
                />
              </div>

              {/* Harga Obat */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <label htmlFor="harga_obat" className="block text-sm font-semibold text-gray-900 dark:text-white">
                      Harga Obat
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Harga satuan dalam Rupiah</p>
                  </div>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-sm font-semibold text-gray-500 dark:text-gray-400 pointer-events-none">
                    Rp
                  </span>
                  <input
                    type="number"
                    name="harga_obat"
                    id="harga_obat"
                    value={formData.harga_obat}
                    onChange={handleChange}
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 block w-full pl-9 p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                    placeholder="0"
                    min="0"
                    required
                  />
                </div>
                <p className="mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                  Masukkan harga dalam Rupiah tanpa titik/koma
                </p>
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
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 dark:bg-green-700 dark:hover:bg-green-800 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Simpan
              </button>
            </div>
          </div>
        </form>

      </div>
    </section>
  );
}