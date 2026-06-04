import { Link } from "react-router-dom";
import logodpm from '../assets/logo-DPM-Unuja.png'
import logounuja from '../assets/Logo-UNUJA (1).png'


export default function Footer(){
    return(
        <>
        <footer className="bg-blue-900 text-white pt-12 pb-6">
          <div className="mx-auto max-w-screen-xl px-4 md:px-8 lg:px-10">
            
            {/* Main Footer Content */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              
              {/* Logo Section */}
              <div className="flex justify-center md:justify-start items-start gap-4">
                <div className="flex gap-3">
                  {/* Logo 1 */}
                  <div className="w-30 h-30 bg-blue-900 rounded-full flex items-center justify-center">
                    <div className="text-2xl font-bold text-blue-900">
                      <img src={logounuja} alt="Logo UNUJA" className="w-24 h-24 object-contain" />
                    </div>
                  </div>
                  {/* Logo 2 */}
                  <div className="w-30 h-30 bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                    <div className="text-2xl font-bold text-blue-900">
                      <img src={logodpm} alt="Logo DPM Unuja" className="w-24 h-24 object-contain" />
                    </div>
                  </div>
                </div>
                
                {/* Social Media Icons */}
                <div className="flex flex-col justify-center gap-3">
                  <p className="text-xs font-semibold text-gray-300">Social media:</p>
                  <div className="flex gap-2">
                    <a href="#" className="w-6 h-6 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                      <span className="text-blue-900 text-xs font-bold">f</span>
                    </a>
                    <a href="#" className="w-6 h-6 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                      <span className="text-blue-900 text-xs font-bold">🐦</span>
                    </a>
                    <a href="#" className="w-6 h-6 bg-white rounded-full flex items-center justify-center hover:bg-gray-200 transition-colors">
                      <span className="text-blue-900 text-xs font-bold">📷</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Alamat Kantor */}
              <div className="text-center md:text-left">
                <h3 className="text-lg font-bold mb-4 border-b-2 border-gray-500 pb-2 inline-block">
                  ALAMAT KANTOR
                </h3>
                <p className="text-sm text-gray-200 leading-relaxed mt-4">
                  Jl. Kyai Haji Mun'im, Dusun Tj. Lor, Desa Karanganyar, Kecamatan Paiton, Kabupaten Probolinggo, <br />Provinsi Jawa Timur, Indonesia<br />
                  <span className="font-semibold">Kode Pos: 67291</span>
                </p>
              </div>

              {/* Pintasan (Quick Links) */}
              <div className="text-center md:text-left">
                <h3 className="text-lg font-bold mb-4 border-b-2 border-gray-500 pb-2 inline-block">
                  PINTASAN
                </h3>
                <ul className="text-sm text-gray-200 space-y-2 mt-4">
                  <li>
                    <Link to="#" className="hover:text-yellow-300 transition-colors">
                      Tentang DPM U
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="hover:text-yellow-300 transition-colors">
                      Informasi
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="hover:text-yellow-300 transition-colors">
                      Pengaduan
                    </Link>
                  </li>
                  <li>
                    <Link to="#" className="hover:text-yellow-300 transition-colors">
                      Produk Hukum
                    </Link>
                  </li>
                </ul>
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-gray-500 my-6"></div>

            {/* Copyright */}
            <div className="text-center">
              <p className="text-xs text-gray-300">
                ©2026 Dewan Perwakilan Mahasiswa Universitas Nurul Jadid. Dikelola oleh Komisi V (Badan Media dan Informasi)
              </p>
            </div>
          </div>
        </footer>
        </>
    )
}