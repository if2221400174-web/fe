export default function Testimonial(){
  return(
    <>
      {/* Main Welcome Section */}
      <section className="bg-white dark:bg-gray-900 py-12 lg:py-16">
        <div className="max-w-screen-xl px-4 py-8 sm:px-6 lg:px-8 mx-auto">
          {/* Header Welcome Box */}
          <div className="bg-blue-900 dark:to-blue-950 rounded-lg p-8 lg:p-12 mb-12 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              {/* Text Content */}
              <div className="text-white">
                <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                  Halo Mahasiswa Universitas Nurul Jadid!
                </h2>
                <p className="text-base lg:text-lg mb-6 leading-relaxed opacity-90">
                  Punya aspirasi, kritik, atau keluhan terkait kehidupan kampus?
                </p>
                <p className="text-base lg:text-lg mb-8 leading-relaxed opacity-90">
                  DPM Universitas Nurul Jadid menyediakan link pengaduan mahasiswa sebagai wadah penyampaian suara anda.
                </p>
                <p className="text-base lg:text-lg mb-8 leading-relaxed opacity-90">
                  Mari bersama wujudkan kampus yang lebih baik.
                </p>
                
                {/* Complaint Button */}
                
              </div>
              
              {/* Illustration */}
              <div className="flex justify-center">
                <div className="w-64 h-64 lg:w-72 lg:h-72 bg-blue-50 dark:bg-gray-800 rounded-2xl flex items-center justify-center shadow-lg">
                  {/* Placeholder for illustration - can be replaced with actual image */}
                  <div className="text-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-32 h-32 mx-auto text-blue-600 dark:text-blue-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5a2 2 0 114 0 2 2 0 00-4 0zM11 9a5 5 0 110 10 5 5 0 010-10z" />
                    </svg>
                    <button className="bg-blue-800 dark:bg-blue-800 text-white font-semibold px-8 py-3 rounded-lg hover:bg-blue-600 dark:hover:bg-blue-700 transition-colors duration-300 shadow-md hover:shadow-lg">
                      Pengaduan
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Three Columns Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Trilogi Santri */}
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-xl lg:text-2xl font-bold text-blue-800 dark:text-white mb-6 pb-4 border-b-2 border-blue-600">
                Trilogi Santri
              </h3>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div>
                  <p className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
                    اَلاِِْهْتِمَامْ بِالْفُرُوْضِ اْلعَيْنِيَّةِ
                  </p>
                  <p className="text-sm leading-relaxed">
                    Memperhatikan kewajiban-kewajiban fardhu ‘Ain.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
                    اَلاِِْهْتِمَامْ بِتَرْكِ اْلكَبَائِرِ
                  </p>
                  <p className="text-sm leading-relaxed">
                    Mawas diri dengan meninggalkan dosa-dosa besar.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
                   حُسْنُ اْلاَدَبِ مَعَ اللهِ وَمَعَ الْخَلْقِ
                  </p>
                  <p className="text-sm leading-relaxed">
                    Berbudi luhur kepada Allah dan Makhluq.
                  </p>
                </div>
              </div>
            </div>

            {/* Panca Kesadaran Santri */}
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-xl lg:text-2xl font-bold text-blue-800  dark:text-white mb-6 pb-4 border-b-2 border-blue-600">
                Panca Kesadaran Santri
              </h3>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div>
                  <p className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
                   اَلْوَعْيُ الدِّيْنِيْ
                  </p>
                  <p className="text-sm leading-relaxed">
                    Kesadaran Beragama.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
                    اَلْوَعْيُ الْعِلْمِيْ
                  </p>
                  <p className="text-sm leading-relaxed">
                    Kesadaran Berilmu.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
                  اَلْوَعْيُ اْلاِجْتِمَاعِيْ
                  </p>
                  <p className="text-sm leading-relaxed">
                    Kesadaran Bermasyarakat.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
                  اَلْوَعْيُ الْحُكُوْمِيْ وَالشُّعِْبيْ
                  </p>
                  <p className="text-sm leading-relaxed">
                    Kesadaran Berbangsa dan Bernegara.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
                  اَلْوَعْيُ النِّظَامِيْ
                  </p>
                  <p className="text-sm leading-relaxed">
                  Kesadaran Berorganisasi.
                  </p>
                </div>
              </div>
            </div>

            {/* Kalam Masyaikh */}
            <div className="bg-gray-50 dark:bg-gray-800 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300">
              <h3 className="text-xl lg:text-2xl font-bold text-blue-800 dark:text-white mb-6 pb-4 border-b-2 border-blue-600">
                Kalam Masyaikh
              </h3>
              <div className="space-y-4 text-gray-700 dark:text-gray-300">
                <div>
                  <p className="font-semibold text-blue-700 dark:text-blue-400 mb-2">
                    KH. Zaini Mun'im:
                  </p>
                  <p className="text-sm leading-relaxed">
                    "Orang yang hidup di Indonesia kemudian tidak melakukan perjuangan, dia telah berbuat maksiat. Orang yang hanya memikirkan masalah pendidikannya sendiri, maka orang itu telah berbuat maksiat. Kita semua harus memikirkan perjuangan rakyat banyak."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Custom CSS Animations */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in-up {
          animation: fadeInUp 0.8s ease-out;
        }
      `}</style>
    </>
  )
}