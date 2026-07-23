import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { toPng } from "html-to-image";
// Pastikan path import ini sesuai dengan lokasi _services Anda
import { getDokumenPublik } from "../_sevices/pasien";

const KLINIK_INFO = {
  namaKlinik: "PRAKTEK DOKTER UMUM",
  namaDokter: "dr. Rowi",
  sip: "SIP. No. 503/185/SIPD/X/2023",
  alamat: "Kec. Guluk-Guluk, Kab. Sumenep, Jawa Timur",
};

export default function DokumenPublik() {
  const { kode_rm } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isDownloading, setIsDownloading] = useState(false);
  const kartuRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getDokumenPublik(kode_rm);
        
        if (res.data) {
           setData(res.data);
        } else {
           setData(res);
        }
      } catch (err) {
        console.error(err);
        setError("Data tidak ditemukan atau terjadi kesalahan server.");
      } finally {
        setLoading(false);
      }
    };
    
    if (kode_rm) fetchData();
  }, [kode_rm]);

  const handleDownloadGambar = async () => {
    if (!kartuRef.current) return;
    setIsDownloading(true);
    
    try {
      const dataUrl = await toPng(kartuRef.current, {
        cacheBust: true,
        pixelRatio: 3, 
        backgroundColor: null,
      });
      const link = document.createElement("a");
      const namaPasien = data?.pasien?.nama || data?.nama || "Pasien";
      link.download = `Kartu-Berobat-${namaPasien.replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      alert("Gagal menyimpan gambar kartu. Silakan coba lagi.");
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mb-3"></div>
        <p className="text-gray-800 font-bold">Menyiapkan Kartu Berobat...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center border border-gray-200">
          <svg className="w-16 h-16 text-red-600 mx-auto mb-4 bg-red-50 rounded-full p-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h2 className="text-xl font-black text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-700 text-sm font-medium leading-relaxed">{error || "Data pasien tidak ditemukan"}</p>
        </div>
      </div>
    );
  }

  const pasien = data.pasien || data;

  return (
    <>
      <div className="min-h-screen bg-gray-100 sm:py-8 font-sans flex flex-col">
        <div className="max-w-md w-full mx-auto bg-white sm:rounded-3xl sm:shadow-2xl overflow-hidden min-h-screen sm:min-h-0 border-x sm:border border-gray-300 flex flex-col">
          
          {/* HEADER DENGAN KONTRAS TINGGI */}
          <div className="bg-gradient-to-br from-green-800 to-green-950 px-6 pt-8 pb-10 text-white rounded-b-[2rem] shadow-lg relative overflow-hidden flex-shrink-0">
            <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 rounded-full bg-white opacity-10 blur-2xl"></div>
            <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-32 h-32 rounded-full bg-green-500 opacity-20 blur-xl"></div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-green-300 text-xs font-bold tracking-wider uppercase mb-1 drop-shadow-sm">Selamat Datang di</p>
                <h1 className="text-2xl font-black tracking-wide text-white drop-shadow-md">{KLINIK_INFO.namaKlinik}</h1>
                <p className="text-green-100 text-sm font-semibold mt-1 drop-shadow-sm">{KLINIK_INFO.namaDokter}</p>
              </div>
              <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm border border-white/30 shadow-inner">
                <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
                  <path d="M12 2a2 2 0 012 2v6h6a2 2 0 012 2v0a2 2 0 01-2 2h-6v6a2 2 0 01-2 2v0a2 2 0 01-2-2v-6H4a2 2 0 01-2-2v0a2 2 0 012-2h6V4a2 2 0 012-2z" fill="#ffffff" />
                </svg>
              </div>
            </div>
          </div>

          <div className="px-5 py-8 -mt-6 relative z-20 flex-1">
            
            {/* E-CARD SECTION KONSISTEN DENGAN ADMIN */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-[15px] font-black text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path>
                  </svg>
                  Kartu Berobat
                </h2>
                <button 
                  onClick={handleDownloadGambar}
                  disabled={isDownloading}
                  className="text-xs font-bold text-white bg-green-700 px-4 py-2 rounded-full hover:bg-green-800 transition-all duration-300 flex items-center gap-1.5 shadow-md disabled:opacity-70"
                >
                  {isDownloading ? (
                    <>
                      <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                      </svg>
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                      </svg>
                      Simpan Ke Galeri
                    </>
                  )}
                </button>
              </div>

              {/* BUNGKUSAN KARTU YANG BISA DI-SCROLL DI HP */}
              <div className="w-full overflow-x-auto pb-4 pt-1 scrollbar-thin flex sm:justify-center">
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
                        <span className="kartu-field-value">{pasien?.kode_rekammedis || "-"}</span>
                      </div>
                      <div className="kartu-field-row">
                        <span className="kartu-field-label">Nama</span>
                        <span className="kartu-field-colon">:</span>
                        <span className="kartu-field-value kartu-field-value-bold">{pasien?.nama || "-"}</span>
                      </div>
                      <div className="kartu-field-row">
                        <span className="kartu-field-label">Tanggal Lahir</span>
                        <span className="kartu-field-colon">:</span>
                        <span className="kartu-field-value">{pasien?.tanggal_lahir || "-"}</span>
                      </div>
                      <div className="kartu-field-row">
                        <span className="kartu-field-label">Jenis Kelamin</span>
                        <span className="kartu-field-colon">:</span>
                        <span className="kartu-field-value">{pasien?.jenis_kelamin || "-"}</span>
                      </div>
                      <div className="kartu-field-row">
                        <span className="kartu-field-label">Alamat</span>
                        <span className="kartu-field-colon">:</span>
                        <span className="kartu-field-value kartu-field-value-kecil">{pasien?.alamat || "-"}</span>
                      </div>
                    </div>

                    <div className="kartu-footer">Kartu harap dibawa setiap kali berobat</div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-200 text-center shadow-sm">
                 <p className="text-sm text-blue-900 font-semibold leading-relaxed">
                   Klik tombol <span className="font-bold text-blue-950 bg-blue-100 px-2 py-0.5 rounded shadow-sm mx-1">Simpan Ke Galeri</span> di atas untuk mengunduh kartu ini, lalu tunjukkan saat Anda berkunjung ke Praktek.
                 </p>
              </div>
            </div>
          </div>
          
          {/* FOOTER */}
          <div className="bg-gray-100 py-6 text-center border-t border-gray-300 mt-auto flex-shrink-0">
            <p className="text-xs font-bold text-gray-600">© {new Date().getFullYear()} {KLINIK_INFO.namaKlinik}</p>
            <p className="text-[11px] font-semibold text-gray-500 mt-1">Sistem Informasi Manajemen Praktek Dokter Umum Digital</p>
          </div>
        </div>
      </div>

      <style>{`
        /* ===== SCROLLBAR CUSTOM ===== */
        .scrollbar-thin {
          scrollbar-width: thin;
          scrollbar-color: #d1d5db transparent;
        }
        .scrollbar-thin::-webkit-scrollbar { height: 6px; }
        .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 9999px;
        }

        /* ===== DESAIN KARTU BEROBAT KONSISTEN DENGAN ADMIN ===== */
        .kartu-pasien {
          position: relative;
          width: 400px;  
          height: 250px; 
          flex-shrink: 0;
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