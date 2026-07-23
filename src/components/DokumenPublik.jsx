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
    try {
      const dataUrl = await toPng(kartuRef.current, {
        cacheBust: true,
        pixelRatio: 3, 
        backgroundColor: null,
      });
      const link = document.createElement("a");
      link.download = `E-Card-${kode_rm}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      alert("Gagal menyimpan gambar kartu.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-700 mb-3"></div>
        <p className="text-gray-500 font-medium">Menyiapkan Kartu Berobat...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-sm w-full text-center border border-gray-100">
          <svg className="w-16 h-16 text-red-500 mx-auto mb-4 bg-red-50 rounded-full p-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Oops!</h2>
          <p className="text-gray-600 text-sm leading-relaxed">{error || "Data tidak ditemukan"}</p>
        </div>
      </div>
    );
  }

  const pasien = data.pasien || data;

  return (
    <div className="min-h-screen bg-gray-100 sm:py-8 font-sans flex flex-col">
      <div className="max-w-md w-full mx-auto bg-white sm:rounded-3xl sm:shadow-2xl overflow-hidden min-h-screen sm:min-h-0 border-x sm:border border-gray-200 flex flex-col">
        
        {/* HEADER */}
        <div className="bg-gradient-to-br from-green-700 to-green-900 px-6 pt-8 pb-10 text-white rounded-b-[2rem] shadow-lg relative overflow-hidden flex-shrink-0">
          <div className="absolute top-0 right-0 -mr-8 -mt-8 w-40 h-40 rounded-full bg-white opacity-10 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -ml-12 -mb-12 w-32 h-32 rounded-full bg-green-500 opacity-20 blur-xl"></div>
          
          <div className="relative z-10 flex items-center justify-between">
            <div>
              <p className="text-green-200 text-xs font-semibold tracking-wider uppercase mb-1">Selamat Datang di</p>
              <h1 className="text-xl font-extrabold tracking-wide text-white">{KLINIK_INFO.namaKlinik}</h1>
              <p className="text-green-50 text-sm font-medium mt-0.5">{KLINIK_INFO.namaDokter}</p>
            </div>
            <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-sm border border-white/20 shadow-inner">
              <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10">
                <path d="M12 2a2 2 0 012 2v6h6a2 2 0 012 2v0a2 2 0 01-2 2h-6v6a2 2 0 01-2 2v0a2 2 0 01-2-2v-6H4a2 2 0 01-2-2v0a2 2 0 012-2h6V4a2 2 0 012-2z" fill="#ffffff" />
              </svg>
            </div>
          </div>
        </div>

        <div className="px-5 py-8 -mt-6 relative z-20 flex-1">
          
          {/* E-CARD SECTION HANYA FOKUS KE KARTU */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-[15px] font-bold text-gray-800 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2"></path></svg>
                Kartu Berobat
              </h2>
              <button 
                onClick={handleDownloadGambar}
                className="text-xs font-bold text-green-700 bg-green-50 px-4 py-2 rounded-full hover:bg-green-600 hover:text-white transition-all duration-300 flex items-center gap-1.5 shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                Simpan Ke Galeri
              </button>
            </div>

            <div className="flex justify-center w-full mt-2">
              <div className="w-full overflow-hidden" style={{ borderRadius: "14px", boxShadow: "0 10px 25px rgba(21, 128, 61, 0.15)" }} ref={kartuRef}>
                 <div style={{ position: 'relative', width: '100%', aspectRatio: '1.6/1', background: '#ffffff', overflow: 'hidden', fontFamily: "'Segoe UI', Arial, sans-serif" }}>
                    <div style={{ position: 'absolute', top: '-18%', left: '-18%', width: '65%', height: '75%', background: 'linear-gradient(135deg, #15803d 0%, #22c55e 55%, #86efac 100%)', clipPath: 'polygon(0 0, 100% 0, 45% 65%, 15% 100%, 0 100%)', zIndex: 0 }}></div>
                    <div style={{ position: 'absolute', bottom: '-10%', left: '-8%', width: '116%', height: '22%', background: 'linear-gradient(90deg, #15803d, #4ade80)', borderRadius: '100% 100% 0 0 / 100% 100% 0 0', zIndex: 0 }}></div>
                    
                    <div style={{ position: 'relative', zIndex: 1, height: '100%', padding: '5% 6%', display: 'flex', flexDirection: 'column' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                          <div>
                             <p style={{ margin: 0, fontSize: 'clamp(10px, 3.5vw, 14px)', fontWeight: 700, color: '#14532d', letterSpacing: '0.5px' }}>{KLINIK_INFO.namaKlinik}</p>
                             <p style={{ margin: '2px 0 0', fontSize: 'clamp(9px, 3vw, 12px)', fontWeight: 600, color: '#1f2937' }}>{KLINIK_INFO.namaDokter}</p>
                             <p style={{ margin: '2px 0 0', fontSize: 'clamp(6px, 2vw, 9px)', color: '#4b5563' }}>{KLINIK_INFO.sip}</p>
                             <p style={{ margin: '1px 0 0', fontSize: 'clamp(6px, 2vw, 9px)', color: '#4b5563' }}>{KLINIK_INFO.alamat}</p>
                          </div>
                          <div style={{ width: 'clamp(26px, 8vw, 36px)', height: 'clamp(26px, 8vw, 36px)', borderRadius: '50%', background: '#ffffff', border: '1.5px solid #16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 4px rgba(0,0,0,0.08)' }}>
                             <svg viewBox="0 0 24 24" fill="none" style={{ width: '55%', height: '55%' }}>
                                <path d="M12 2a2 2 0 012 2v6h6a2 2 0 012 2v0a2 2 0 01-2 2h-6v6a2 2 0 01-2 2v0a2 2 0 01-2-2v-6H4a2 2 0 01-2-2v0a2 2 0 012-2h6V4a2 2 0 012-2z" fill="#15803d"/>
                             </svg>
                          </div>
                       </div>
  
                       <div style={{ alignSelf: 'flex-start', marginTop: '3%', fontSize: 'clamp(7px, 2.2vw, 10px)', fontWeight: 700, letterSpacing: '0.5px', color: '#ffffff', background: 'linear-gradient(90deg, #f59e0b, #fb923c)', padding: '2px 8px', borderRadius: '999px' }}>KARTU BEROBAT</div>
  
                       <div style={{ marginTop: 'auto', marginBottom: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {[
                             { label: 'No. RM', value: pasien?.kode_rekammedis },
                             { label: 'Nama', value: pasien?.nama, bold: true },
                             { label: 'Tgl Lahir', value: pasien?.tanggal_lahir },
                             { label: 'Kelamin', value: pasien?.jenis_kelamin },
                             { label: 'Alamat', value: pasien?.alamat, small: true }
                          ].map((item, i) => (
                             <div key={i} style={{ display: 'flex', alignItems: 'baseline', fontSize: 'clamp(8px, 2.8vw, 12px)' }}>
                                <span style={{ width: '25%', flexShrink: 0, fontWeight: 600, color: '#374151' }}>{item.label}</span>
                                <span style={{ color: '#374151', marginRight: '4px' }}>:</span>
                                <span style={{ flex: 1, color: '#111827', borderBottom: '1px dotted #d1d5db', paddingBottom: '1px', fontWeight: item.bold ? 700 : 400, textTransform: item.bold ? 'uppercase' : (item.small ? 'capitalize' : 'none'), fontSize: item.small ? 'clamp(7.5px, 2.5vw, 11px)' : 'inherit' }}>
                                   {item.value || "-"}
                                </span>
                             </div>
                          ))}
                       </div>
  
                       <div style={{ textAlign: 'center', fontSize: 'clamp(6px, 1.8vw, 8px)', fontStyle: 'italic', color: '#6b7280', marginTop: 'auto' }}>
                          Kartu harap dibawa setiap kali berobat
                       </div>
                    </div>
                 </div>
              </div>
            </div>
            
            <div className="mt-8 p-4 bg-green-50 rounded-xl border border-green-100 text-center">
               <p className="text-xs text-green-800 font-medium leading-relaxed">
                 Klik tombol <span className="font-bold">Simpan Ke Galeri</span> di atas untuk mengunduh kartu ini, lalu tunjukkan kepada petugas saat Anda berkunjung ke Praktek.
               </p>
            </div>
          </div>
        </div>
        
        {/* FOOTER */}
        <div className="bg-gray-50 py-6 text-center border-t border-gray-100 mt-auto flex-shrink-0">
          <p className="text-xs font-semibold text-gray-400">© {new Date().getFullYear()} {KLINIK_INFO.namaKlinik}</p>
          <p className="text-[10px] text-gray-400 mt-1">Sistem Informasi Manajemen Praktek Dokter Umum dr. Rowi Digital</p>
        </div>
      </div>
    </div>
  );
}