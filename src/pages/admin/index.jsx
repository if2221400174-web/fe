import { useEffect, useState } from "react";
import { getPasien } from "../../_sevices/pasien";
import { getObat } from "../../_sevices/obat";
import { getPemeriksaan } from "../../_sevices/pemeriksaan";
import { getTransaksi } from "../../_sevices/transaksi";
import { Link } from "react-router-dom";

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalPasien: 0,
    totalObat: 0,
    totalPendapatan: 0,
    pemeriksaanHariIni: 0,
    transaksiHariIni: 0,
  });

  const [grafikPemeriksaan, setGrafikPemeriksaan] = useState([]);
  const [grafikPendapatan, setGrafikPendapatan] = useState([]);
  const [filterPendapatan, setFilterPendapatan] = useState("harian");
  const [rataRataPendapatan, setRataRataPendapatan] = useState(0);
  const [diagnosaTerbanyak, setDiagnosaTerbanyak] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rawTransaksi, setRawTransaksi] = useState([]);
  const [rawPemeriksaan, setRawPemeriksaan] = useState([]);
  
  // STATE BARU: Untuk menyimpan antrean pasien yang belum dibayar
  const [antreanTransaksi, setAntreanTransaksi] = useState([]);

  const getTodayString = () => new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [pasienData, obatData, pemeriksaanData, transaksiData] =
          await Promise.all([getPasien(), getObat(), getPemeriksaan(), getTransaksi()]);

        const today = getTodayString();
        setRawTransaksi(transaksiData || []);
        setRawPemeriksaan(pemeriksaanData || []);

        const totalPasien = pasienData?.length || 0;
        const totalObat = obatData?.length || 0;
        const totalPendapatan = (transaksiData || []).reduce(
          (sum, t) => sum + (t.total_tarif || 0), 0
        );

        const pemeriksaanHariIni = (pemeriksaanData || []).filter((p) => {
          const tgl = new Date(p.tanggal_pemeriksaan).toISOString().split("T")[0];
          return tgl === today;
        }).length;

        const idPemeriksaanHariIni = new Set(
          (pemeriksaanData || [])
            .filter((p) => {
              const tgl = new Date(p.tanggal_pemeriksaan).toISOString().split("T")[0];
              return tgl === today;
            })
            .map((p) => p.idpemeriksaan)
        );

        const transaksiHariIni = (transaksiData || []).filter((t) =>
          idPemeriksaanHariIni.has(t.pemeriksaan_idpemeriksaan)
        ).length;

        // --- LOGIKA NOTIFIKASI ANTREAN (Sinkron 100% dengan AdminTransaksi) ---
        // Mencari transaksi yang statusnya bukan "lunas"
        const transaksiBelumLunas = (transaksiData || []).filter((t) => t.status !== "lunas");
        
        const antreanLengkap = transaksiBelumLunas.map((t) => {
          return {
            id: t.id,
            pemeriksaan_id: t.pemeriksaan?.id || t.pemeriksaan_idpemeriksaan,
            nama_pasien: t.pemeriksaan?.rekam_medis?.pasien?.nama || "Pasien Tidak Diketahui",
            tanggal: t.created_at,
          };
        });

        // Urutkan dari yang terbaru
        antreanLengkap.sort((a, b) => new Date(b.tanggal) - new Date(a.tanggal));
        setAntreanTransaksi(antreanLengkap);
        // ----------------------------------------------------------------------

        setStats({ totalPasien, totalObat, totalPendapatan, pemeriksaanHariIni, transaksiHariIni });

        hitungGrafikPemeriksaan(pemeriksaanData || []);
        hitungDiagnosaTerbanyak(pemeriksaanData || []);
        setIsLoading(false);
      } catch (error) {
        console.error("Gagal mengambil data dashboard:", error);
        setIsLoading(false);
      }
    };

    fetchAllData();
  }, []);

  useEffect(() => {
    if (rawTransaksi.length > 0 || rawPemeriksaan.length > 0) {
      hitungGrafikPendapatan(rawTransaksi, filterPendapatan);
    }
  }, [filterPendapatan, rawTransaksi, rawPemeriksaan]);

  const hitungGrafikPemeriksaan = (data) => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
      const tgl = new Date();
      tgl.setDate(tgl.getDate() - i);
      const tglStr = tgl.toISOString().split("T")[0];
      const label = `${tgl.getDate()}/${tgl.getMonth() + 1}`;
      const jumlah = data.filter((p) => {
        const tglP = new Date(p.tanggal_pemeriksaan).toISOString().split("T")[0];
        return tglP === tglStr;
      }).length;
      result.push({ label, jumlah });
    }
    setGrafikPemeriksaan(result);
  };

  const hitungGrafikPendapatan = (transaksiData, filter) => {
    const transaksiDenganTanggal = transaksiData.map((t) => ({
      ...t,
      tanggal: t.created_at,
    }));

    let result = [];
    const now = new Date();

    if (filter === "harian") {
      for (let i = 6; i >= 0; i--) {
        const tgl = new Date();
        tgl.setDate(tgl.getDate() - i);
        const tglStr = tgl.toISOString().split("T")[0];
        const label = `${tgl.getDate()}/${tgl.getMonth() + 1}`;
        const total = transaksiDenganTanggal
          .filter((t) => t.tanggal && new Date(t.tanggal).toISOString().split("T")[0] === tglStr)
          .reduce((sum, t) => sum + (t.total_tarif || 0), 0);
        result.push({ label, total });
      }
    } else if (filter === "mingguan") {
      for (let i = 5; i >= 0; i--) {
        const awal = new Date();
        awal.setDate(awal.getDate() - i * 7 - awal.getDay());
        const akhir = new Date(awal);
        akhir.setDate(awal.getDate() + 6);
        const label = `${awal.getDate()}/${awal.getMonth() + 1}`;
        const total = transaksiDenganTanggal
          .filter((t) => {
            if (!t.tanggal) return false;
            const tgl = new Date(t.tanggal);
            return tgl >= awal && tgl <= akhir;
          })
          .reduce((sum, t) => sum + (t.total_tarif || 0), 0);
        result.push({ label, total });
      }
    } else if (filter === "bulanan") {
      const namaBulan = ["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"];
      for (let i = 5; i >= 0; i--) {
        const tgl = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const label = namaBulan[tgl.getMonth()];
        const total = transaksiDenganTanggal
          .filter((t) => {
            if (!t.tanggal) return false;
            const tglT = new Date(t.tanggal);
            return tglT.getMonth() === tgl.getMonth() && tglT.getFullYear() === tgl.getFullYear();
          })
          .reduce((sum, t) => sum + (t.total_tarif || 0), 0);
        result.push({ label, total });
      }
    }

    const tanggalList = transaksiDenganTanggal
      .filter((t) => t.tanggal)
      .map((t) => new Date(t.tanggal).getTime());

    let jumlahHari = 1;
    if (tanggalList.length > 0) {
      const earliest = Math.min(...tanggalList);
      const diffDays = Math.ceil((now.getTime() - earliest) / (1000 * 60 * 60 * 24));
      jumlahHari = Math.max(1, diffDays);
    }

    const totalSemua = transaksiData.reduce((sum, t) => sum + (t.total_tarif || 0), 0);
    setRataRataPendapatan(Math.round(totalSemua / jumlahHari));
    setGrafikPendapatan(result);
  };

  const hitungDiagnosaTerbanyak = (data) => {
    const frekuensi = {};
    data.forEach((p) => {
      const diagnosa = p.diagnosa?.trim();
      if (diagnosa) frekuensi[diagnosa] = (frekuensi[diagnosa] || 0) + 1;
    });
    const sorted = Object.entries(frekuensi)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([nama, jumlah]) => ({ nama, jumlah }));
    setDiagnosaTerbanyak(sorted);
  };

  const formatRupiah = (angka) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(angka);


  if (isLoading) {
    return (
      <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Memuat Dashboard...
          </p>
        </div>
      </section>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {new Date().toLocaleDateString("id-ID", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <span className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-green-100 border border-green-200 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Laporan Real-Time
          </span>
        </div>

        {/* ── BANNER NOTIFIKASI ANTREAN TRANSAKSI ── */}
        {antreanTransaksi.length > 0 && (
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 sm:p-5 rounded-r-xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-amber-100 rounded-full flex-shrink-0 mt-1 sm:mt-0">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-base font-bold text-amber-900">
                  Perhatian: Ada {antreanTransaksi.length} Tagihan Belum Dibayar!
                </h3>
                <p className="text-sm text-amber-700 mt-1">
                  Terdapat transaksi dari dokter yang menunggu proses pelunasan Admin (Bisa langsung diklik):
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {antreanTransaksi.slice(0, 3).map(p => (
                    <Link 
                      key={p.id}
                      to={`/admin/transaksi/create/${p.pemeriksaan_id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 text-xs font-semibold rounded-full border border-amber-200 transition-colors shadow-sm cursor-pointer"
                      title="Klik untuk langsung membayar"
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" /></svg>
                      {p.nama_pasien}
                    </Link>
                  ))}
                  {antreanTransaksi.length > 3 && (
                    <span className="inline-flex items-center px-3 py-1 bg-amber-100/50 text-amber-700 text-xs font-semibold rounded-full">
                      +{antreanTransaksi.length - 3} lainnya
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Link 
              to="/admin/transaksi" 
              className="flex-shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2.5 px-5 rounded-lg transition-colors shadow-sm"
            >
              Lihat Semua Tagihan
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
            </Link>
          </div>
        )}
        {/* ────────────────────────────────────────── */}

        {/* PERBAIKAN: Menyesuaikan grid agar pas untuk 3 kartu (di laptop 3 sejajar, di HP/tablet 2 + 1 lebar) */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Kartu Total Pasien */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                {/* Ikon pasien */}
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <Link
                  to="/admin/pasien"
                  className="flex items-center gap-1 text-base font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-1.5 py-1 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4" />
                  </svg>
              </Link>
            </div>
            <p className="text-2xl text-center font-bold text-gray-800">{stats.totalPasien.toLocaleString("id-ID")}</p>
            <p className="text-sm text-center text-gray-600 mt-1">Total Pasien</p>
          </div>

          {/* Kartu Total Obat */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-violet-50 rounded-xl">
                {/* Ikon obat */}
                <svg className="w-5 h-5 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <Link
                  to="/admin/obat"
                  className="flex items-center gap-1 text-base font-medium text-violet-600 bg-violet-50 hover:bg-violet-100 border border-violet-200 px-1.5 py-1 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4" />
                  </svg>
              </Link>
            </div>
            <p className="text-2xl text-center font-bold text-gray-800">{stats.totalObat.toLocaleString("id-ID")}</p>
            <p className="text-sm text-center text-gray-600 mt-1">Total Obat</p>
          </div>

          {/* Kartu Pemeriksaan Hari Ini (Membentang penuh di HP, tapi 1 kolom di Laptop) */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow col-span-2 lg:col-span-1">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-50 rounded-xl">
                {/* Ikon pemeriksaan */}
                <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <Link
                  to="/admin/pemeriksaan"
                  className="flex items-center gap-1 text-base font-medium text-amber-600 bg-amber-50 hover:bg-amber-100 border border-amber-200 px-1.5 py-1 rounded-lg transition-colors"
                >
                  <svg
                    className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6M9 16h4" />
                  </svg>
              </Link>
            </div>
            <p className="text-2xl text-center font-bold text-gray-800">{stats.pemeriksaanHariIni}</p>
            <p className="text-sm text-center text-gray-600 mt-1">Pemeriksaan Hari Ini</p>
          </div>          
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-full  overflow-hidden">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-gray-800">Kunjungan Pasien 7 Hari Terakhir</h2>
              <p className="text-xs text-gray-400 mt-0.5">Jumlah pemeriksaan per hari</p>
            </div>

            {/* Bar chart sederhana menggunakan div */}
            <div className="flex-1 flex flex-col justify-end">
              <div className="flex items-end gap-1 h-35 w-full">
                {grafikPemeriksaan.map((item, idx) => {
                  // Hitung tinggi batang relatif terhadap nilai maksimum
                  const maxVal = Math.max(...grafikPemeriksaan.map((d) => d.jumlah), 1);
                  const tinggi = Math.max((item.jumlah / maxVal) * 100, 4);
                  const isToday = idx === grafikPemeriksaan.length - 1;

                  return (
                    <div key={idx} className="flex-1 min-w-0 flex flex-col items-center justify-end gap-1 group">
                      <span className="text-xs font-medium text-gray-600">
                        {item.jumlah}
                      </span>
                      <div className="w-full relative">
                        <div
                          className={`w-full rounded-t-md transition-all duration-500 ${
                            isToday ? "bg-green-600" : "bg-green-300"
                          }`}
                          style={{ height: `${tinggi * 0.5}px` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-400">{item.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-800">
                  Laporan Pendapatan
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  Rata-rata per hari:{" "}
                  <span className="font-semibold text-green-700">
                    {formatRupiah(rataRataPendapatan)}
                  </span>
                </p>
              </div>
              <div className="flex items-center">
                <select
                  value={filterPendapatan}
                  onChange={(e) => setFilterPendapatan(e.target.value)}
                  className="md:hidden text-xs font-medium text-green-900 bg-green-50 border border-green-300 rounded-lg px-3.5 py-1.5 outline-none cursor-pointer transition-all appearance-none"
                >
                  <option value="harian">Harian</option>
                  <option value="mingguan">Mingguan</option>
                  <option value="bulanan">Bulanan</option>
                </select>

                <div className="hidden md:flex bg-gray-100 rounded-xl p-1 gap-1">
                  {["harian", "mingguan", "bulanan"].map((opt) => (
                    <button
                      key={opt}
                      onClick={() => setFilterPendapatan(opt)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-lg capitalize transition-all ${
                        filterPendapatan === opt
                          ? "bg-white text-green-700"
                          : "text-gray-800 hover:text-gray-700"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-end gap-2 h-36 mt-10">
              {grafikPendapatan.map((item, idx) => {
                const maxvolume = Math.max(...grafikPendapatan.map((d) => d.total), 1);
                const tinggi = Math.max((item.total / maxvolume) * 100, 4);

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute bottom-full text-gray-700 text-[7px] sm:text-[10px] md:text-xs lg:text-xs font-medium px-2">
                      {formatRupiah(item.total)}
                    </div>
                    <div className="w-full">
                      <div
                        className="w-full rounded-t-md bg-green-600"
                        style={{ height: `${tinggi * 1.3}px` }}
                      ></div>
                    </div>
                    {/* Label */}
                    <span className="text-xs text-gray-400">{item.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="mb-5">
            <h2 className="text-sm font-bold text-gray-800">Penyakit Dominan</h2>
            <p className="text-xs text-gray-400 mt-0.5">5 diagnosa berdasarkan frekuensi</p>
          </div>

          {diagnosaTerbanyak.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">Belum ada data diagnosa</p>
          ) : (
            <div className="space-y-3">
              {diagnosaTerbanyak.map((item, idx) => {
                // Hitung persentase relatif terhadap diagnosa terbanyak
                const maxJumlah = diagnosaTerbanyak[0]?.jumlah || 1;
                const persentase = Math.round((item.jumlah / maxJumlah) * 100);

                // Warna berbeda untuk setiap peringkat
                const warnaBatang = [
                  "bg-green-600",
                  "bg-green-500",
                  "bg-green-400",
                  "bg-green-300",
                  "bg-green-200",
                ][idx] || "bg-gray-400";

                return (
                  <div key={idx} className="flex items-center gap-3">
                    {/* Peringkat */}
                    <span className="flex-shrink-0 w-5 text-xs font-bold text-gray-400 text-right">
                      {idx + 1}
                    </span>
                    {/* Nama diagnosa */}
                    <span className="flex-shrink-0 w-36 text-sm text-gray-700 truncate font-medium">
                      {item.nama}
                    </span>
                    {/* Progress bar horizontal */}
                    <div className="flex-1 bg-gray-100 rounded-2 h-2.5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${warnaBatang}`}
                        style={{ width: `${persentase}%` }}
                      ></div>
                    </div>
                    {/* Jumlah kasus */}
                    <span className="flex-shrink-0 text-sm font-bold text-gray-700 w-8 text-right">
                      {item.jumlah}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}