import { useEffect, useState } from "react";
import { getPasien } from "../../_sevices/pasien";
import { getObat } from "../../_sevices/obat";
import { getPemeriksaan, deletePemeriksaan } from "../../_sevices/pemeriksaan";
import { getTransaksi } from "../../_sevices/transaksi";
import { getRekamMedis } from "../../_sevices/rekamMedis";
import { Link, useNavigate } from "react-router-dom";

export default function DashboardDokter() {
  const navigate = useNavigate();
  
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
  
  // STATE BARU: Untuk menyimpan pasien yang antre
  const [antreanDokter, setAntreanDokter] = useState([]);
  const [isAccepting, setIsAccepting] = useState(null);

  const getTodayString = () => new Date().toISOString().split("T")[0];

  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const [pasienData, obatData, pemeriksaanData, transaksiData, rekamMedisData] =
          await Promise.all([getPasien(), getObat(), getPemeriksaan(), getTransaksi(), getRekamMedis()]);

        const today = getTodayString();
        setRawTransaksi(transaksiData || []);
        setRawPemeriksaan(pemeriksaanData || []);

        // --- LOGIKA MENGAMBIL ANTREAN & MENGURUTKAN ---
        let antreanTokens = (pemeriksaanData || []).filter(p => p.keluhan === "ANTREAN_DARI_ADMIN");
        
        // Urutkan berdasarkan ID (yang id-nya terkecil berarti dikirim paling duluan)
        antreanTokens = antreanTokens.sort((a, b) => a.idpemeriksaan - b.idpemeriksaan);

        const listAntrean = antreanTokens.map((token, index) => {
            const rm = (rekamMedisData || []).find(r => r.id === token.rekam_medis_id);
            if (!rm) return null;
            const pas = (pasienData || []).find(p => p.id === rm.pasien_id);
            if (!pas) return null;
            
            return { 
              ...pas, 
              id_pemeriksaan_antrean: token.idpemeriksaan, 
              urutan_antrean: index + 1 // Urutan #1, #2, #3, dst...
            };
        }).filter(Boolean); 

        setAntreanDokter(listAntrean);
        // ---------------------------------------------

        const totalPasien = pasienData?.length || 0;
        const totalObat = obatData?.length || 0;
        const totalPendapatan = (transaksiData || []).reduce(
          (sum, t) => sum + (t.total_tarif || 0), 0
        );

        const pemeriksaanHariIni = (pemeriksaanData || []).filter((p) => {
          const tgl = new Date(p.tanggal_pemeriksaan).toISOString().split("T")[0];
          return tgl === today && p.keluhan !== "ANTREAN_DARI_ADMIN"; 
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
        return tglP === tglStr && p.keluhan !== "ANTREAN_DARI_ADMIN"; 
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
      if (diagnosa && diagnosa !== "-") frekuensi[diagnosa] = (frekuensi[diagnosa] || 0) + 1;
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

  // --- AKSI MENERIMA PASIEN DARI ANTREAN ---
  const handleTerimaPasien = async (pasienId, idAntrean) => {
    try {
      setIsAccepting(idAntrean);
      await deletePemeriksaan(idAntrean); 
      navigate(`/dokter/pemeriksaan/create/${pasienId}`); 
    } catch (error) {
      console.error(error);
      alert("Gagal menerima pasien. Periksa koneksi atau coba lagi.");
      setIsAccepting(null);
    }
  };

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

        {/* --- KOTAK DAFTAR ANTREAN PASIEN (SCROLL HORIZONTAL) --- */}
        {antreanDokter.length > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-3 shadow-sm relative overflow-hidden mb-4">
            <div className="absolute top-0 left-0 w-1 h-full bg-green-500 animate-pulse"></div>
            <div className="flex items-center gap-2 mb-3 px-2 mt-1">
              <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              <h2 className="text-sm font-bold text-green-800">Pasien Menunggu: {antreanDokter.length} Orang</h2>
            </div>
            
            <div className="flex flex-nowrap overflow-x-auto gap-3 px-2 pb-3 scrollbar-thin">
              {antreanDokter.map((pasien) => (
                <div key={pasien.id_pemeriksaan_antrean} className="flex-none bg-white border border-green-200 pl-3 pr-1.5 py-1.5 rounded-lg flex items-center justify-between gap-4 shadow-sm hover:border-green-400 transition-colors min-w-[220px] max-w-[260px]">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="bg-green-100 text-green-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded">
                        #{pasien.urutan_antrean}
                      </span>
                      <p className="font-bold text-gray-800 uppercase text-xs line-clamp-1">{pasien.nama}</p>
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium pl-1">{pasien.kode_rekammedis || "Belum ada RM"}</p>
                  </div>
                  <button
                    onClick={() => handleTerimaPasien(pasien.id, pasien.id_pemeriksaan_antrean)}
                    disabled={isAccepting === pasien.id_pemeriksaan_antrean}
                    className="bg-green-600 hover:bg-green-700 text-white text-[11px] font-semibold py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5 shadow-sm disabled:opacity-60 flex-shrink-0"
                  >
                    {isAccepting === pasien.id_pemeriksaan_antrean ? (
                       <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                         <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                         <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                       </svg>
                    ) : (
                      <span>Periksa</span>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        {/* ------------------------------------------- */}

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

          {/* Kartu Total Pasien */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-blue-50 rounded-xl">
                <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <Link
                  to="/dokter/pasien"
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
                <svg className="w-5 h-5 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <Link
                  to="/dokter/obat"
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

          {/* Kartu Pemeriksaan Hari Ini */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-amber-50 rounded-xl">
                <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                </svg>
              </div>
              <Link
                  to="/dokter/pemeriksaan"
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
            <p className="text-sm text-center text-gray-600 mt-1">Pemeriksaan Selesai</p>
          </div>

          {/* Kartu Total Pendapatan */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="p-2 bg-emerald-50 rounded-xl">
                <svg className="w-5 h-5 text-emerald-600" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                </svg>
              </div>
              <Link
                  to="/dokter/transaksi"
                  className="flex items-center gap-1 text-base font-medium text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-1 rounded-lg transition-colors"
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
            <p className="text-lg text-center font-bold text-gray-800 truncate">{formatRupiah(stats.totalPendapatan)}</p>
            <p className="text-sm text-center text-gray-600 mt-1">Total Pendapatan</p>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 flex flex-col h-full  overflow-hidden">
            <div className="mb-4">
              <h2 className="text-sm font-bold text-gray-800">Kunjungan Pasien 7 Hari Terakhir</h2>
              <p className="text-xs text-gray-400 mt-0.5">Jumlah pemeriksaan per hari</p>
            </div>

            <div className="flex-1 flex flex-col justify-end">
              <div className="flex items-end gap-1 h-35 w-full">
                {grafikPemeriksaan.map((item, idx) => {
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
                const maxJumlah = diagnosaTerbanyak[0]?.jumlah || 1;
                const persentase = Math.round((item.jumlah / maxJumlah) * 100);

                const warnaBatang = [
                  "bg-green-600",
                  "bg-green-500",
                  "bg-green-400",
                  "bg-green-300",
                  "bg-green-200",
                ][idx] || "bg-gray-400";

                return (
                  <div key={idx} className="flex items-center gap-3">
                    <span className="flex-shrink-0 w-5 text-xs font-bold text-gray-400 text-right">
                      {idx + 1}
                    </span>
                    <span className="flex-shrink-0 w-36 text-sm text-gray-700 truncate font-medium">
                      {item.nama}
                    </span>
                    <div className="flex-1 bg-gray-100 rounded-2 h-2.5">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${warnaBatang}`}
                        style={{ width: `${persentase}%` }}
                      ></div>
                    </div>
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