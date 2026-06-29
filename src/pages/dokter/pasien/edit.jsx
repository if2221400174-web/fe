import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { showPasien, updatePasien } from "../../../_sevices/pasien";

// ─── Fungsi pengambilan data dari API Wilayah Indonesia ───────────────────────
// Base URL untuk semua endpoint wilayah
const BASE_URL = "https://www.emsifa.com/api-wilayah-indonesia/api";

// Mengambil daftar seluruh provinsi di Indonesia
const fetchProvinsi = () =>
  fetch(`${BASE_URL}/provinces.json`).then((r) => r.json());

// Mengambil daftar kabupaten/kota berdasarkan ID provinsi
const fetchKabupaten = (id) =>
  fetch(`${BASE_URL}/regencies/${id}.json`).then((r) => r.json());

// Mengambil daftar kecamatan berdasarkan ID kabupaten/kota
const fetchKecamatan = (id) =>
  fetch(`${BASE_URL}/districts/${id}.json`).then((r) => r.json());

// Mengambil daftar desa/kelurahan berdasarkan ID kecamatan
const fetchDesa = (id) =>
  fetch(`${BASE_URL}/villages/${id}.json`).then((r) => r.json());
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Mengubah string menjadi format Title Case
 * Contoh: "JAWA TIMUR" → "Jawa Timur"
 */
const toTitleCase = (str) =>
  str.toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase());

// Daftar pilihan negara dan jenis kelamin
const NEGARA_LIST = ["Indonesia"];
const JENIS_KELAMIN_LIST = ["Laki-laki", "Perempuan"];

// ─── Komponen SearchableSelect ────────────────────────────────────────────────
/**
 * Komponen dropdown dengan fitur pencarian dan input manual.
 * Digunakan untuk memilih wilayah (provinsi, kabupaten, kecamatan, desa).
 *
 * Props:
 * - options     : daftar pilihan { id, name }
 * - value       : ID pilihan yang sedang aktif
 * - onChange    : fungsi callback saat pilihan berubah
 * - placeholder : teks saat belum ada pilihan
 * - loadingText : teks saat data sedang dimuat
 * - isLoading   : status sedang memuat atau tidak
 * - disabled    : nonaktifkan dropdown
 * - required    : tandai wajib diisi untuk validasi form
 */
function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder,
  loadingText,
  isLoading,
  disabled,
  required,
}) {
  // State untuk kata kunci pencarian di dalam dropdown
  const [query, setQuery] = useState("");

  // State untuk membuka/menutup dropdown
  const [open, setOpen] = useState(false);

  // State untuk beralih ke mode input manual
  const [isManual, setIsManual] = useState(false);

  // State untuk menyimpan nilai input manual
  const [manualValue, setManualValue] = useState("");

  // Ref ke elemen container agar klik di luar bisa menutup dropdown
  const containerRef = useRef(null);

  // Ref ke input pencarian agar bisa otomatis fokus saat dropdown dibuka
  const inputRef = useRef(null);

  // Cari objek pilihan yang sedang aktif berdasarkan value (ID)
  const selected = options.find((o) => o.id === value);

  // Label yang ditampilkan pada tombol dropdown (Title Case)
  const displayLabel = selected ? toTitleCase(selected.name) : "";

  // Tandai apakah pilihan saat ini adalah hasil input manual
  const isManualSelected = value === "__manual__";

  // Filter daftar pilihan berdasarkan kata kunci pencarian
  const filtered = query
    ? options.filter((o) => o.name.toLowerCase().includes(query.toLowerCase()))
    : options;

  /**
   * Menutup dropdown saat pengguna mengklik di luar area komponen.
   * Event listener dipasang saat mount dan dibersihkan saat unmount.
   */
  useEffect(() => {
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /**
   * Otomatis fokuskan input pencarian setiap kali dropdown dibuka.
   */
  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  /**
   * Menangani pemilihan item dari daftar dropdown.
   * Memanggil onChange dengan ID item, lalu menutup dropdown.
   */
  const handleSelect = (item) => {
    onChange({ target: { value: item.id } });
    setOpen(false);
    setQuery("");
    setIsManual(false);
    setManualValue("");
  };

  /**
   * Mengirimkan nilai input manual ke parent komponen.
   * Hanya dijalankan jika input manual tidak kosong.
   * Mengirim value "__manual__" sebagai penanda bahwa ini input manual.
   */
  const handleManualSubmit = () => {
    if (manualValue.trim()) {
      onChange({ target: { value: "__manual__", manualName: manualValue.trim() } });
      setIsManual(false);
      setOpen(false);
      setQuery("");
    }
  };

  /**
   * Beralih ke mode input manual.
   * Menutup dropdown dan mengosongkan pencarian.
   */
  const handleSwitchToManual = () => {
    setIsManual(true);
    setOpen(false);
    setQuery("");
    setManualValue("");
  };

  /**
   * Membatalkan mode input manual dan kembali ke dropdown biasa.
   */
  const handleCancelManual = () => {
    setIsManual(false);
    setManualValue("");
  };

  // Tampilkan input manual jika mode manual aktif
  if (isManual) {
    return (
      <div className="flex gap-2">
        <input
          type="text"
          value={manualValue}
          onChange={(e) => setManualValue(e.target.value)}
          // Tekan Enter untuk langsung submit nilai manual
          onKeyDown={(e) =>
            e.key === "Enter" && (e.preventDefault(), handleManualSubmit())
          }
          className="bg-gray-50 border border-green-400 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 block w-full p-3 dark:bg-gray-700 dark:border-green-600 dark:text-white"
          placeholder="Ketik nama wilayah..."
          autoFocus
        />
        {/* Tombol konfirmasi input manual */}
        <button
          type="button"
          onClick={handleManualSubmit}
          disabled={!manualValue.trim()}
          className="px-3 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
        >
          OK
        </button>
        {/* Tombol batal, kembali ke mode dropdown */}
        <button
          type="button"
          onClick={handleCancelManual}
          className="px-3 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 flex-shrink-0"
        >
          Batal
        </button>
      </div>
    );
  }

  // Tampilan dropdown utama
  return (
    <div ref={containerRef} className="relative">
      {/* Tombol pemicu dropdown */}
      <button
        type="button"
        onClick={() => !disabled && setOpen((o) => !o)}
        disabled={disabled}
        className={`bg-gray-50 border ${
          open ? "border-green-500 ring-2 ring-green-500" : "border-gray-300"
        } text-sm rounded-lg flex items-center w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 text-left`}
      >
        {/* Tampilkan spinner saat data sedang dimuat */}
        {isLoading ? (
          <span className="text-gray-400 flex-1 flex items-center gap-2">
            <svg
              className="w-4 h-4 animate-spin text-green-500 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
            {loadingText}
          </span>
        ) : (
          // Tampilkan label pilihan aktif, penanda manual, atau placeholder
          <span
            className={`flex-1 truncate ${
              !displayLabel && !isManualSelected
                ? "text-gray-400 dark:text-gray-500"
                : "text-gray-900 dark:text-white"
            }`}
          >
            {isManualSelected ? (
              // Jika pilihan manual aktif, tampilkan ikon pensil + teks "Manual"
              <span className="flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" clipRule="evenodd" />
                </svg>
                Manual
              </span>
            ) : (
              // Tampilkan nama pilihan aktif atau placeholder
              displayLabel || placeholder
            )}
          </span>
        )}
        {/* Ikon panah yang berputar saat dropdown terbuka */}
        <svg
          className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Panel dropdown — hanya tampil saat open = true */}
      {open && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg overflow-hidden">

          {/* Input pencarian di dalam dropdown */}
          <div className="p-2 border-b border-gray-100 dark:border-gray-700">
            <div className="relative">
              <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0" />
              </svg>
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full pl-8 pr-8 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-md text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-green-500"
                placeholder="Cari..."
              />
              {/* Tombol hapus kata kunci pencarian */}
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              )}
            </div>
          </div>

          {/* Daftar pilihan hasil filter pencarian */}
          <ul className="max-h-52 overflow-y-auto">
            {filtered.length === 0 ? (
              // Tampilkan pesan jika tidak ada hasil yang cocok
              <li className="px-4 py-3 text-sm text-gray-400 dark:text-gray-500 text-center italic">
                Tidak ditemukan
              </li>
            ) : (
              filtered.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors duration-100 ${
                      value === item.id
                        ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 font-medium"
                        : "text-gray-900 dark:text-white"
                    }`}
                  >
                    {toTitleCase(item.name)}
                  </button>
                </li>
              ))
            )}
          </ul>

          {/* Opsi isi manual jika wilayah tidak tersedia di daftar */}
          <div className="border-t border-gray-100 dark:border-gray-700 p-2">
            <button
              type="button"
              onClick={handleSwitchToManual}
              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-md transition-colors duration-100"
            >
              <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" clipRule="evenodd" />
              </svg>
              Tidak ada pilihan? Isi manual
            </button>
          </div>
        </div>
      )}

      {/*
        Input tersembunyi untuk memastikan validasi HTML5 (required) berjalan.
        Tidak terlihat oleh pengguna, hanya digunakan browser untuk validasi form.
      */}
      {required && (
        <input
          tabIndex={-1}
          required
          value={value || ""}
          onChange={() => {}}
          style={{ position: "absolute", opacity: 0, height: 0, width: 0, pointerEvents: "none" }}
        />
      )}
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Halaman Edit Pasien.
 * Memuat data pasien berdasarkan ID dari URL, mengisi form,
 * lalu mengirim perubahan ke server saat form disubmit.
 */
export default function EditPasienDok() {
  // Ambil ID pasien dari parameter URL (misal: /dokter/pasien/edit/5)
  const { id } = useParams();
  const navigate = useNavigate();

  // State utama form — menyimpan semua nilai input
  const [formData, setFormData] = useState({
    nama: "",
    tanggal_lahir: "",
    jenis_kelamin: "",
    negara: "Indonesia",
    provinsi: "",
    kabupaten: "",
    kecamatan: "",
    desa: "",
    detail_alamat: "",
  });

  // State untuk menyimpan daftar pilihan tiap level wilayah
  const [options, setOptions] = useState({
    provinsi: [],
    kabupaten: [],
    kecamatan: [],
    desa: [],
  });

  // State untuk menyimpan objek wilayah yang sedang dipilih (berisi id & name)
  const [selected, setSelected] = useState({
    provinsi: null,
    kabupaten: null,
    kecamatan: null,
    desa: null,
  });

  // State loading per level wilayah saat fetch API berlangsung
  const [loading, setLoading] = useState({
    provinsi: false,
    kabupaten: false,
    kecamatan: false,
    desa: false,
  });

  // State loading halaman penuh saat data pasien pertama kali dimuat
  const [isPageLoading, setIsPageLoading] = useState(true);

  // State untuk mencegah submit ganda saat form sedang diproses
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Fetch data pasien & prefill form ────────────────────────────────────
  /**
   * Saat komponen pertama kali dimount, ambil data pasien dari server
   * berdasarkan ID, lalu isi semua field form termasuk dropdown wilayah
   * secara bertingkat (provinsi → kabupaten → kecamatan → desa).
   *
   * Jika suatu level wilayah tidak cocok dengan data API (misalnya
   * data lama yang diisi manual), level tersebut ditandai sebagai "__manual__"
   * agar tetap tampil di dropdown tanpa error.
   */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await showPasien(id);
        const data = res.data;

        // Alamat tersimpan sebagai satu string: "Detail, Desa, Kecamatan, Kabupaten, Provinsi, Negara"
        // Pisahkan berdasarkan koma untuk mengisi masing-masing field
        const alamatParts = (data.alamat || "").split(",").map((s) => s.trim());
        const [detail, desa, kecamatan, kabupaten, provinsi, negara] = alamatParts;

        // Isi semua field form dengan data yang sudah di-parse
        setFormData({
          nama: data.nama || "",
          tanggal_lahir: data.tanggal_lahir || "",
          jenis_kelamin: data.jenis_kelamin || "",
          negara: negara || "Indonesia",
          provinsi: provinsi ? toTitleCase(provinsi) : "",
          kabupaten: kabupaten ? toTitleCase(kabupaten) : "",
          kecamatan: kecamatan ? toTitleCase(kecamatan) : "",
          desa: desa ? toTitleCase(desa) : "",
          detail_alamat: detail || "",
        });

        // Muat semua provinsi lalu cocokkan dengan data tersimpan
        const provinsiList = await fetchProvinsi();
        setOptions((o) => ({ ...o, provinsi: provinsiList }));

        if (provinsi) {
          const matchedProvinsi = provinsiList.find(
            (p) => p.name.toLowerCase() === provinsi.toLowerCase()
          );

          // Jika provinsi tidak ditemukan di API, tandai sebagai input manual
          if (!matchedProvinsi) {
            setSelected((s) => ({
              ...s,
              provinsi: { id: "__manual__", name: toTitleCase(provinsi) },
            }));
            setIsPageLoading(false);
            return;
          }

          // Provinsi cocok — simpan dan lanjut muat kabupaten
          setSelected((s) => ({ ...s, provinsi: matchedProvinsi }));
          const kabupatenList = await fetchKabupaten(matchedProvinsi.id);
          setOptions((o) => ({ ...o, kabupaten: kabupatenList }));

          if (kabupaten) {
            const matchedKabupaten = kabupatenList.find(
              (k) => k.name.toLowerCase() === kabupaten.toLowerCase()
            );

            // Jika kabupaten tidak ditemukan, tandai manual dan berhenti
            if (!matchedKabupaten) {
              setSelected((s) => ({
                ...s,
                kabupaten: { id: "__manual__", name: toTitleCase(kabupaten) },
              }));
              setIsPageLoading(false);
              return;
            }

            // Kabupaten cocok — simpan dan lanjut muat kecamatan
            setSelected((s) => ({ ...s, kabupaten: matchedKabupaten }));
            const kecamatanList = await fetchKecamatan(matchedKabupaten.id);
            setOptions((o) => ({ ...o, kecamatan: kecamatanList }));

            if (kecamatan) {
              const matchedKecamatan = kecamatanList.find(
                (k) => k.name.toLowerCase() === kecamatan.toLowerCase()
              );

              // Jika kecamatan tidak ditemukan, tandai manual dan berhenti
              if (!matchedKecamatan) {
                setSelected((s) => ({
                  ...s,
                  kecamatan: { id: "__manual__", name: toTitleCase(kecamatan) },
                }));
                setIsPageLoading(false);
                return;
              }

              // Kecamatan cocok — simpan dan lanjut muat desa
              setSelected((s) => ({ ...s, kecamatan: matchedKecamatan }));
              const desaList = await fetchDesa(matchedKecamatan.id);
              setOptions((o) => ({ ...o, desa: desaList }));

              if (desa) {
                const matchedDesa = desaList.find(
                  (d) => d.name.toLowerCase() === desa.toLowerCase()
                );
                // Jika desa tidak cocok, tandai manual; jika cocok, simpan langsung
                setSelected((s) => ({
                  ...s,
                  desa: matchedDesa || { id: "__manual__", name: toTitleCase(desa) },
                }));
              }
            }
          }
        }
      } catch (error) {
        console.error("Error fetching pasien:", error);
        alert("Gagal memuat data pasien.");
        navigate("/dokter/pasien");
      } finally {
        // Sembunyikan loading halaman, baik sukses maupun gagal
        setIsPageLoading(false);
      }
    };

    fetchData();
  }, [id, navigate]);

  // ─── Handler perubahan input teks/select biasa ────────────────────────────
  /**
   * Menangani perubahan pada input teks dan select standar (nama, tanggal lahir, dll).
   * Memperbarui field yang sesuai di formData berdasarkan atribut name elemen.
   */
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ─── Handler perubahan negara ─────────────────────────────────────────────
  /**
   * Menangani perubahan pilihan negara.
   * Mereset semua field alamat dan daftar opsi wilayah karena data wilayah
   * bergantung pada negara yang dipilih.
   * Jika negara adalah Indonesia, langsung muat daftar provinsi.
   */
  const handleNegara = (e) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      negara: value,
      provinsi: "",
      kabupaten: "",
      kecamatan: "",
      desa: "",
      detail_alamat: "",
    }));
    // Reset semua pilihan dan daftar wilayah
    setSelected({ provinsi: null, kabupaten: null, kecamatan: null, desa: null });
    setOptions({ provinsi: [], kabupaten: [], kecamatan: [], desa: [] });

    // Muat provinsi jika negara yang dipilih adalah Indonesia
    if (value === "Indonesia") {
      setLoading((l) => ({ ...l, provinsi: true }));
      fetchProvinsi()
        .then((data) => setOptions((o) => ({ ...o, provinsi: data })))
        .catch(() => {})
        .finally(() => setLoading((l) => ({ ...l, provinsi: false })));
    }
  };

  // ─── Helper: resolve nama dari event SearchableSelect ────────────────────
  /**
   * Mengubah event dari SearchableSelect menjadi objek { id, name }.
   * Menangani dua kasus:
   * - Pilihan dari daftar: cari item di optionsList berdasarkan ID
   * - Input manual: gunakan manualName dari event target langsung
   */
  const resolveName = (e, optionsList) => {
    if (e.target.value === "__manual__") {
      // Input manual — ambil nama dari properti tambahan di event
      return { id: "__manual__", name: toTitleCase(e.target.manualName || "") };
    }
    // Pilihan normal — temukan item di daftar berdasarkan ID
    const item = optionsList.find((o) => o.id === e.target.value);
    return item ? { id: item.id, name: toTitleCase(item.name) } : null;
  };

  // ─── Handler perubahan provinsi ───────────────────────────────────────────
  /**
   * Menangani pemilihan provinsi.
   * Mereset kabupaten, kecamatan, dan desa karena bergantung pada provinsi.
   * Jika bukan input manual, langsung ambil daftar kabupaten dari API.
   */
  const handleProvinsi = (e) => {
    const item = resolveName(e, options.provinsi);
    setSelected((s) => ({ ...s, provinsi: item, kabupaten: null, kecamatan: null, desa: null }));
    setFormData((prev) => ({
      ...prev,
      provinsi: item?.name || "",
      kabupaten: "",
      kecamatan: "",
      desa: "",
    }));
    // Kosongkan daftar level di bawah provinsi
    setOptions((o) => ({ ...o, kabupaten: [], kecamatan: [], desa: [] }));

    // Hanya fetch kabupaten jika pilihan bukan input manual
    if (item && item.id !== "__manual__") {
      setLoading((l) => ({ ...l, kabupaten: true }));
      fetchKabupaten(item.id)
        .then((data) => setOptions((o) => ({ ...o, kabupaten: data })))
        .catch(() => {})
        .finally(() => setLoading((l) => ({ ...l, kabupaten: false })));
    }
  };

  // ─── Handler perubahan kabupaten/kota ────────────────────────────────────
  /**
   * Menangani pemilihan kabupaten/kota.
   * Mereset kecamatan dan desa, lalu memuat daftar kecamatan dari API
   * jika pilihan bukan input manual.
   */
  const handleKabupaten = (e) => {
    const item = resolveName(e, options.kabupaten);
    setSelected((s) => ({ ...s, kabupaten: item, kecamatan: null, desa: null }));
    setFormData((prev) => ({ ...prev, kabupaten: item?.name || "", kecamatan: "", desa: "" }));
    // Kosongkan daftar kecamatan dan desa
    setOptions((o) => ({ ...o, kecamatan: [], desa: [] }));

    // Hanya fetch kecamatan jika pilihan bukan input manual
    if (item && item.id !== "__manual__") {
      setLoading((l) => ({ ...l, kecamatan: true }));
      fetchKecamatan(item.id)
        .then((data) => setOptions((o) => ({ ...o, kecamatan: data })))
        .catch(() => {})
        .finally(() => setLoading((l) => ({ ...l, kecamatan: false })));
    }
  };

  // ─── Handler perubahan kecamatan ──────────────────────────────────────────
  /**
   * Menangani pemilihan kecamatan.
   * Mereset desa, lalu memuat daftar desa/kelurahan dari API
   * jika pilihan bukan input manual.
   */
  const handleKecamatan = (e) => {
    const item = resolveName(e, options.kecamatan);
    setSelected((s) => ({ ...s, kecamatan: item, desa: null }));
    setFormData((prev) => ({ ...prev, kecamatan: item?.name || "", desa: "" }));
    // Kosongkan daftar desa
    setOptions((o) => ({ ...o, desa: [] }));

    // Hanya fetch desa jika pilihan bukan input manual
    if (item && item.id !== "__manual__") {
      setLoading((l) => ({ ...l, desa: true }));
      fetchDesa(item.id)
        .then((data) => setOptions((o) => ({ ...o, desa: data })))
        .catch(() => {})
        .finally(() => setLoading((l) => ({ ...l, desa: false })));
    }
  };

  // ─── Handler perubahan desa/kelurahan ────────────────────────────────────
  /**
   * Menangani pemilihan desa atau kelurahan.
   * Tidak ada level di bawahnya, jadi hanya update state selected dan formData.
   */
  const handleDesa = (e) => {
    const item = resolveName(e, options.desa);
    setSelected((s) => ({ ...s, desa: item }));
    setFormData((prev) => ({ ...prev, desa: item?.name || "" }));
  };

  // ─── Fungsi membangun string alamat lengkap ───────────────────────────────
  /**
   * Menggabungkan semua bagian alamat menjadi satu string.
   * Urutan: detail → desa → kecamatan → kabupaten → provinsi → negara.
   * Bagian yang kosong akan dilewati (filter Boolean).
   * Hasilnya dikirim ke server sebagai field "alamat".
   */
  const buildAlamat = () =>
    [
      formData.detail_alamat,
      formData.desa,
      formData.kecamatan,
      formData.kabupaten,
      formData.provinsi,
      formData.negara,
    ]
      .filter(Boolean)
      .join(", ");

  // ─── Handler submit form ──────────────────────────────────────────────────
  /**
   * Menangani pengiriman form edit pasien ke server.
   * Membangun objek data dari formData, lalu memanggil updatePasien.
   * Jika berhasil, redirect ke halaman daftar pasien.
   * Jika gagal, tampilkan pesan error yang diambil dari respons server.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Siapkan data yang akan dikirim ke API
    const submitData = {
      nama: formData.nama,
      alamat: buildAlamat(),
      tanggal_lahir: formData.tanggal_lahir,
      jenis_kelamin: formData.jenis_kelamin,
    };

    try {
      await updatePasien(id, submitData);
      // Redirect ke halaman daftar pasien setelah berhasil
      navigate("/dokter/pasien");
    } catch (error) {
      const data = error.response?.data;
      console.error("Status:", error.response?.status);
      console.error("Data:", JSON.stringify(data, null, 2));

      /**
       * Mengekstrak pesan error dari berbagai kemungkinan struktur respons Laravel:
       * 1. { errors: { field: ["pesan"] } } — validasi 422
       * 2. { message: "pesan" } — error umum
       * 3. Fallback: tampilkan seluruh data sebagai JSON
       */
      const extractMessage = (data) => {
        if (!data) return null;
        if (data.errors && typeof data.errors === "object") {
          const firstField = Object.values(data.errors)[0];
          if (Array.isArray(firstField)) return firstField[0];
          if (typeof firstField === "string") return firstField;
        }
        if (data.message && typeof data.message === "string") return data.message;
        return JSON.stringify(data);
      };

      const msg = extractMessage(data);
      alert(msg ? `Gagal menyimpan:\n${msg}` : "Terjadi kesalahan sistem. Silakan coba lagi.");
    } finally {
      // Aktifkan kembali tombol submit setelah proses selesai
      setIsSubmitting(false);
    }
  };

  // ─── Handler reset form ───────────────────────────────────────────────────
  /**
   * Mengosongkan field data diri (nama, tanggal lahir, jenis kelamin, detail alamat).
   * Field wilayah (provinsi–desa) tidak direset agar tidak perlu dipilih ulang.
   */
  const handleReset = () => {
    setFormData((prev) => ({
      ...prev,
      nama: "",
      tanggal_lahir: "",
      jenis_kelamin: "",
      detail_alamat: "",
    }));
  };

  // ─── Kelas CSS bersama untuk input dan select ─────────────────────────────
  // Kelas Tailwind yang dipakai berulang untuk semua elemen input teks
  const inputClass =
    "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200";

  // Kelas Tailwind yang dipakai berulang untuk semua elemen select
  const selectClass =
    "bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200";

  /**
   * Komponen ikon kecil dengan latar hijau muda.
   * Digunakan sebagai dekorasi di sebelah kiri label setiap field form.
   */
  const FieldIcon = ({ children }) => (
    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg flex-shrink-0">
      {children}
    </div>
  );

  /**
   * Komponen pemisah seksi dengan label teks di tengah.
   * Digunakan untuk memisahkan bagian "Data Diri" dan "Alamat" di form.
   */
  const SectionDivider = ({ label }) => (
    <div className="flex items-center gap-3 pt-2">
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
      <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
        {label}
      </span>
      <div className="flex-1 h-px bg-gray-200 dark:bg-gray-600" />
    </div>
  );

  // ─── Tampilan loading halaman penuh ──────────────────────────────────────
  // Tampilkan spinner selama data pasien dan wilayah belum selesai dimuat
  if (isPageLoading) {
    return (
      <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-900" />
          <p className="mt-4 text-gray-600 dark:text-gray-400">Memuat data pasien...</p>
        </div>
      </section>
    );
  }

  // ─── Render form utama ────────────────────────────────────────────────────
  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-2xl px-4 py-6 mx-auto">

        {/* Header halaman: judul + tombol kembali */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Form Edit Pasien</h2>
          </div>
          <button
            onClick={() => navigate("/dokter/pasien")}
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

              {/* Kotak info mode edit */}
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 flex flex-col items-center justify-center">
                <div className="flex gap-3">
                  <div>
                    <h3 className="text-sm text-center font-semibold text-green-900 dark:text-green-300 mb-1">Mode Edit</h3>
                    <p className="text-sm text-center text-green-800 dark:text-green-400">
                      Pastikan semua informasi benar sebelum menyimpan perubahan.
                    </p>
                  </div>
                </div>
              </div>

              {/* ── Seksi Data Diri ── */}
              <SectionDivider label="Data Diri" />

              {/* Field: Nama Pasien */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FieldIcon>
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </FieldIcon>
                  <div>
                    <label htmlFor="nama" className="block text-sm font-semibold text-gray-900 dark:text-white">
                      Nama Pasien
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nama lengkap sesuai identitas</p>
                  </div>
                </div>
                <input
                  type="text"
                  name="nama"
                  id="nama"
                  value={formData.nama}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="cth. Budi Santoso"
                  required
                />
              </div>

              {/* Field: Tanggal Lahir + Jenis Kelamin (2 kolom) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Tanggal Lahir */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FieldIcon>
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </FieldIcon>
                    <div>
                      <label htmlFor="tanggal_lahir" className="block text-sm font-semibold text-gray-900 dark:text-white">
                        Tanggal Lahir
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Pastikan valid</p>
                    </div>
                  </div>
                  <input
                    type="date"
                    name="tanggal_lahir"
                    id="tanggal_lahir"
                    value={formData.tanggal_lahir}
                    onChange={handleChange}
                    className={inputClass}
                    required
                  />
                </div>

                {/* Jenis Kelamin */}
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FieldIcon>
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </FieldIcon>
                    <div>
                      <label htmlFor="jenis_kelamin" className="block text-sm font-semibold text-gray-900 dark:text-white">
                        Jenis Kelamin
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Pilih satu</p>
                    </div>
                  </div>
                  <select
                    name="jenis_kelamin"
                    id="jenis_kelamin"
                    value={formData.jenis_kelamin}
                    onChange={handleChange}
                    className={selectClass}
                    required
                  >
                    <option value="">-- Pilih --</option>
                    {JENIS_KELAMIN_LIST.map((jk) => (
                      <option key={jk} value={jk}>{jk}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── Seksi Alamat ── */}
              <SectionDivider label="Alamat" />

              {/* Field: Negara */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FieldIcon>
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM4.332 8.027a6.012 6.012 0 011.912-2.706C6.512 5.73 6.974 6 7.5 6A1.5 1.5 0 019 7.5V8a2 2 0 004 0 2 2 0 011.523-1.943A5.977 5.977 0 0116 10c0 .34-.028.675-.083 1H15a2 2 0 00-2 2v2.197A5.973 5.973 0 0110 16v-2a2 2 0 00-2-2 2 2 0 01-2-2 2 2 0 00-1.668-1.973z" clipRule="evenodd" />
                    </svg>
                  </FieldIcon>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                      Negara
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pilih negara domisili</p>
                  </div>
                </div>
                <select
                  name="negara"
                  value={formData.negara}
                  onChange={handleNegara}
                  className={selectClass}
                  required
                >
                  <option value="">-- Pilih Negara --</option>
                  {NEGARA_LIST.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
              </div>

              {/* Field: Provinsi — menggunakan SearchableSelect */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FieldIcon>
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </FieldIcon>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                      Provinsi
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pilih atau cari provinsi</p>
                  </div>
                </div>
                <SearchableSelect
                  options={options.provinsi}
                  value={selected.provinsi?.id || ""}
                  onChange={handleProvinsi}
                  placeholder="-- Pilih Provinsi --"
                  loadingText="Memuat provinsi..."
                  isLoading={loading.provinsi}
                  disabled={!formData.negara || loading.provinsi}
                  required
                />
              </div>

              {/* Field: Kabupaten/Kota — aktif setelah provinsi dipilih */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FieldIcon>
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                    </svg>
                  </FieldIcon>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                      Kabupaten / Kota
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selected.provinsi ? "Pilih atau cari kabupaten/kota" : "Pilih provinsi dulu"}
                    </p>
                  </div>
                </div>
                <SearchableSelect
                  options={options.kabupaten}
                  value={selected.kabupaten?.id || ""}
                  onChange={handleKabupaten}
                  placeholder={selected.provinsi ? "-- Pilih Kabupaten/Kota --" : "-- Pilih provinsi dulu --"}
                  loadingText="Memuat kabupaten/kota..."
                  isLoading={loading.kabupaten}
                  disabled={!selected.provinsi || loading.kabupaten}
                  required
                />
              </div>

              {/* Field: Kecamatan — aktif setelah kabupaten dipilih */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FieldIcon>
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                  </FieldIcon>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                      Kecamatan
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selected.kabupaten ? "Pilih atau cari kecamatan" : "Pilih kabupaten dulu"}
                    </p>
                  </div>
                </div>
                <SearchableSelect
                  options={options.kecamatan}
                  value={selected.kecamatan?.id || ""}
                  onChange={handleKecamatan}
                  placeholder={selected.kabupaten ? "-- Pilih Kecamatan --" : "-- Pilih kabupaten dulu --"}
                  loadingText="Memuat kecamatan..."
                  isLoading={loading.kecamatan}
                  disabled={!selected.kabupaten || loading.kecamatan}
                  required
                />
              </div>

              {/* Field: Desa/Kelurahan — aktif setelah kecamatan dipilih */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FieldIcon>
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                    </svg>
                  </FieldIcon>
                  <div>
                    <label className="block text-sm font-semibold text-gray-900 dark:text-white">
                      Desa / Kelurahan
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {selected.kecamatan ? "Pilih atau cari desa/kelurahan" : "Pilih kecamatan dulu"}
                    </p>
                  </div>
                </div>
                <SearchableSelect
                  options={options.desa}
                  value={selected.desa?.id || ""}
                  onChange={handleDesa}
                  placeholder={selected.kecamatan ? "-- Pilih Desa/Kelurahan --" : "-- Pilih kecamatan dulu --"}
                  loadingText="Memuat desa/kelurahan..."
                  isLoading={loading.desa}
                  disabled={!selected.kecamatan || loading.desa}
                  required
                />
              </div>

              {/* Field: Detail Alamat (jalan, nomor, RT/RW) */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <FieldIcon>
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h8a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                    </svg>
                  </FieldIcon>
                  <div>
                    <label htmlFor="detail_alamat" className="block text-sm font-semibold text-gray-900 dark:text-white">
                      Detail Alamat
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Nama jalan, nomor rumah, RT/RW</p>
                  </div>
                </div>
                <input
                  type="text"
                  name="detail_alamat"
                  id="detail_alamat"
                  value={formData.detail_alamat}
                  onChange={handleChange}
                  className={inputClass}
                  placeholder="cth. Jl. Merdeka No. 12, RT 03/RW 02"
                />
              </div>

              {/* Preview alamat lengkap — tampil jika minimal satu bagian terisi */}
              {(formData.detail_alamat || formData.desa || formData.kecamatan) && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                  <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-1 uppercase tracking-wide">
                    Preview Alamat Lengkap
                  </p>
                  <p className="text-sm text-green-900 dark:text-green-200">{buildAlamat()}</p>
                </div>
              )}
            </div>

            {/* Tombol aksi form: Reset dan Simpan */}
            <div className="flex items-center justify-between gap-4 px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
              {/* Tombol reset — mengosongkan field data diri */}
              <button
                type="reset"
                onClick={handleReset}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-all duration-200"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                </svg>
                Reset
              </button>

              {/* Tombol simpan — mengirim form ke server */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-green-900 rounded-lg hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 dark:bg-green-900 dark:hover:bg-green-800 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 shadow-md hover:shadow-lg"
              >
                {/* Tampilkan spinner dan teks "Menyimpan..." saat proses berlangsung */}
                {isSubmitting ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
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