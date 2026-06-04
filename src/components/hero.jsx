import { useState } from "react";
import { Link } from "react-router-dom";
import bgdpm from "../assets/bg 1.jpg";

export default function HeroSection() {
  const [searchQuery, setSearchQuery] = useState("");

  // Handle search
  const handleSearch = (e) => {
    e.preventDefault();
    console.log("Searching for:", searchQuery);
    // Implement search logic here
  };

  // Info cards data
  const infoCards = [
    {
      id: 1,
      title: "Judul Informasi Terbaru",
      image: "/images/info1.jpg",
      link: "/informasi/1"
    },
    {
      id: 2,
      title: "Judul Informasi Terbaru",
      image: "/images/info2.jpg",
      link: "/informasi/2"
    },
    {
      id: 3,
      title: "Judul Informasi Terbaru",
      image: "/images/info3.jpg",
      link: "/informasi/3"
    },
    {
      id: 4,
      title: "Judul Informasi Terbaru",
      image: "/images/info4.jpg",
      link: "/informasi/4"
    },
  ];

  return (
    <div className="w-full">
      {/* Hero Section dengan Background Image */}
      <div className="relative min-h-[500px] flex items-center justify-center overflow-hidden">
        {/* Background Image */}
        <img
          src={bgdpm}
          alt="Background DPM"
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        {/* Overlay dengan gradient blue */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/75 via-indigo-900/75 to-blue-900/75"></div>
        
        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-20">
          {/* Title */}
          <h1 className="text-white sm:text-4xl lg:text-5xl font-serif mb-8 leading-tight tracking-tight drop-shadow-2xl">
            DEWAN PERWAKILAN MAHASISWA<br />
            UNIVERSITAS NURUL JADID
          </h1>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="max-w-2xl mx-auto">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari yang anda butuhkan"
                className="w-full px-6 py-4 pr-12 rounded-full text-gray-700 font-medium text-base placeholder-gray-500 focus:outline-none focus:ring-4 focus:ring-white/50 shadow-2xl transition-all duration-300 bg-white"
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-800 hover:bg-blue-900 text-white p-3 rounded-full transition-all duration-300 shadow-lg hover:shadow-xl"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </form>
        </div>

        {/* Running Text at Bottom */}
        <div className="absolute bottom-0 left-0 right-0 bg-blue-900 py-2">
          <div className="relative group">
            <div className="flex whitespace-nowrap animate-scroll group-hover:[animation-play-state:paused]">
              
              {/* Teks 1 */}
              <p className="text-white text-2xl font-inter inline-block px-4">
                Selamat datang di website Dewan Perwakilan Mahasiswa Universitas Nurul Jadid, dapatkan informasi lainnya seputar aktivitas kami!.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Informasi Terbaru Section */}
      <div className="bg-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Title */}
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12 text-blue-900">
            Informasi terbaru
          </h2>

          {/* Info Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
            {infoCards.map((card) => (
              <Link
                key={card.id}
                to={card.link}
                className="group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                {/* Card Image */}
                <div className="aspect-[3/4] relative overflow-hidden bg-gray-200">
                  <img
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    onError={(e) => {
                      // Fallback jika gambar tidak ditemukan
                      e.target.src = "https://via.placeholder.com/300x400/4F46E5/FFFFFF?text=DPM+Info";
                    }}
                  />
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/90 via-blue-900/50 to-transparent"></div>
                  
                  {/* Card Title */}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-white text-xl font-bold leading-tight">
                      {card.title}
                    </h3>
                  </div>
                </div>

                {/* Hover Effect Border */}
                <div className="absolute inset-0 border-4 border-transparent group-hover:border-blue-500 rounded-2xl transition-all duration-300 pointer-events-none"></div>
              </Link>
            ))}
          </div>

          {/* View More Button */}
          <div className="text-center">
            <Link
              to="/informasi"
              className="inline-block px-8 py-4 bg-blue-900 hover:bg-blue-800 text-white font-bold text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
            >
              Dapatkan informasi lainnya
            </Link>
          </div>
        </div>
      </div>

      {/* CSS Animation untuk Running Text */}
      <style jsx>{`
        @keyframes scroll {
          0% {
            transform: translateX(100%);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        .animate-scroll {
          animation: scroll 20s linear infinite;
        }

        .animate-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}