import { useEffect, useState, useRef } from "react";
import { Link, Outlet, useNavigate, useLocation } from "react-router-dom";
import { logout, useDecodeToken } from "../_sevices/auth";
import logokesehtan from '../assets/Logo Kesehatan.png'
import { userImageStorage } from "../_api";


export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("accessToken");
  const rawUser = localStorage.getItem("userInfo");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  
  let userInfo;
  try {
    userInfo = rawUser ? JSON.parse(rawUser) : { foto: "", username: "", email: "", role: "" };
  } catch (error) {
    console.error("Failed to parse userInfo from localStorage:", error);
    userInfo = { foto: "", username: "", email: "", role: "" };
  }
  
  const decodedData = useDecodeToken(token);
  const userInitial = userInfo?.username ? userInfo.username.charAt(0).toUpperCase() : "?";
  const userPhoto = userInfo?.foto
  ? `${userImageStorage}/${userInfo.foto}`
  : null;

  useEffect(() => {
    if (!token || !decodedData || !decodedData.success) {
      navigate("/login");
    }

    const role = userInfo?.role;
    if (role !== "admin") {
      alert("Access denied. Admins only.");
      navigate("/login");
    }
  }, [token, decodedData, navigate, userInfo?.role]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close sidebar on navigation (mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    if (token) {
      await logout({ token, userInfo });
      navigate("/login");
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <>
      <div className="antialiased bg-gray-50 dark:bg-gray-900">
        {/* Navbar */}
        <nav className="bg-green-700 border-b border-gray-200 fixed top-0 left-0 w-full z-50 shadow-sm">
          <div className="px-3 sm:px-4 lg:px-6 py-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 sm:space-x-4 flex-1">
                {/* Menu garis tiga */}
                <button
                  onClick={toggleSidebar}
                  className="md:hidden p-2 p-2 text-white rounded-full hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all duration-200"
                  aria-label="Toggle sidebar"
                >
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                  </svg>
                </button>

                {/* Logo */}
                <Link to="/admin" className="flex items-center space-x-1 sm:space-x-3 pr-9">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-700 rounded-lg flex items-center justify-center transition-transform duration-200 hover:scale-105">
                    <img
                    src={logokesehtan}
                    />
                  </div>
                  <span className="hidden sm:block text-lg lg:text-xl font-semibold text-gray-100 ">Praktek Dokter Umum dr. Rowi</span>
                </Link>
              </div>

              {/* Right Side Icons */}
              <div className="flex items-center space-x-1 sm:space-x-2">

                {/* User Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={toggleDropdown}
                    className="flex items-center space-x-2 focus:outline-none group"
                    aria-label="User menu"
                  >
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full ring-2 ring-white ring-offset-1 ring-offset-green-700 overflow-hidden flex-shrink-0 bg-white flex items-center justify-center">
                      {userPhoto ? (
                        <img
                          src={userPhoto}
                          alt="profile"
                          className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-green-700 font-semibold text-sm sm:text-lg">
                            {userInitial}
                          </span>
                        )
                      }
                    </div>
                  </button>
                  {/* Dropdown Menu */}
                  {isDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 py-0 z-50 overflow-hidden animate-fadeIn">
                      
                      {/* Header dengan foto & info user */}
                      <div className="px-5 py-4 bg-gradient-to-br from-green-700 to-green-800">
                        <div className="flex items-center space-x-3">
                          <div className="w-14 h-14 rounded-full ring-2 ring-white ring-offset-1 ring-offset-green-700 overflow-hidden flex-shrink-0 bg-white flex items-center justify-center">
                            {userPhoto ? (
                              <img
                                src={userPhoto}
                                alt="profile"
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <span
                              className="text-green-700 font-bold text-xl"
                              style={{ display: userPhoto ? 'none' : 'flex' }}
                            >
                              {userInitial}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-base font-medium text-green-700 truncate">
                              {userInfo?.username}
                            </p>
                            <span className="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-green-200 text-green-700 rounded-full capitalize">
                              {userInfo?.role}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Menu items */}
                      <div className="py-2 px-2">
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            navigate(`/admin/profile/edit`);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-150"
                        >
                          <div className="w-8 h-8 rounded-lg bg-green-50 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-gray-800 dark:text-gray-100">Edit Profile</p>
                            <p className="text-xs text-gray-400">Ubah foto & informasi akun</p>
                          </div>
                        </button>
                      </div>

                      {/* Divider + Logout */}
                      <div className="border-t border-gray-100 dark:border-gray-700 py-2 px-2">
                        <button
                          onClick={() => {
                            setIsDropdownOpen(false);
                            handleLogout();
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150"
                        >
                          <div className="w-8 h-8 rounded-lg bg-red-50 dark:bg-red-600 flex items-center justify-center flex-shrink-0">
                            <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                            </svg>
                          </div>
                          <div className="text-left">
                            <p className="font-medium text-red-600">Sign Out</p>
                            <p className="text-xs text-gray-400">Keluar dari sesi ini</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </nav>

        {/* Sidebar */}
        <aside
          className={`fixed top-0 left-0 z-40 w-64 sm:w-72 lg:w-64 h-screen pt-16 transition-transform duration-300 ease-in-out ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          } md:translate-x-0 bg-white border-r border-gray-200 shadow-lg md:shadow-none`}
          aria-label="Sidenav"
        >
          <div className="overflow-y-auto py-4 px-3 h-full bg-white scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">

            {/* Navigation Links */}
            <ul className="space-y-1">
              <li>
                <Link
                  to="/admin"
                  className={`flex items-center p-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                    isActive("/admin")
                      ? "bg-green-50 text-green-900"
                      : "text-gray-700 hover:bg-green-50 hover:text-green-900"
                  }`}
                >
                  <svg className={`w-5 h-5 transition-colors duration-200 ${
                    isActive("/admin") 
                    ? "bg-green-50 text-green-900" 
                    : "text-gray-500 group-hover:text-green-900"
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"></path>
                    <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"></path>
                  </svg>
                  <span className="ml-3">Dashboard</span>
                  {isActive("/admin") && (
                    <div className="ml-auto w-1 h-6 bg-green-900 rounded-l"></div>
                  )}
                </Link>
              </li>

              <li>
                <Link
                  to="/admin/users"
                  className={`flex items-center p-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                    isActive("/admin/users")
                      ? "bg-green-50 text-green-900"
                      : "text-gray-700 hover:bg-green-50 hover:text-green-900"
                  }`}
                >
                  <svg className={`w-5 h-5 transition-colors duration-200 ${
                    isActive("/admin/users") ? "text-green-900" : "text-gray-500 group-hover:text-green-900"
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z"></path>
                  </svg>
                  <span className="ml-3">Petugas</span>
                  {isActive("/admin/users") && (
                    <div className="ml-auto w-1 h-6 bg-green-900 rounded-l"></div>
                  )}
                </Link>
              </li>

              <li>
                <Link
                  to="/admin/obat"
                  className={`flex items-center p-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                    isActive("/admin/obat")
                      ? "bg-green-50 text-green-900"
                      : "text-gray-700 hover:bg-green-50 hover:text-green-900"
                  }`}
                >
                  <svg className={`w-5 h-5 transition-colors duration-200 ${
                    isActive("/admin/obat") ? "text-green-900" : "text-gray-500 group-hover:text-green-900"
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v1h16V4a1 1 0 00-1-1H3zm0 4v9a2 2 0 002 2h10a2 2 0 002-2V7H3zm7 2a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1H8a1 1 0 110-2h1V9a1 1 0 011-1z" clipRule="evenodd"/>
                  </svg>
                  <span className="ml-3">Obat</span>
                  {isActive("/admin/obat") && (
                    <div className="ml-auto w-1 h-6 bg-green-900 rounded-l"></div>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/pasien"
                  className={`flex items-center p-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                    isActive("/admin/pasien")
                      ? "bg-green-50 text-green-900"
                      : "text-gray-700 hover:bg-green-50 hover:text-green-900"
                  }`}
                >
                  <svg className={`w-5 h-5 transition-colors duration-200 ${
                    isActive("/admin/pasien") ? "text-green-900" : "text-gray-500 group-hover:text-green-900"
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 9a3 3 0 100-6 3 3 0 000 6z" />
                    <path fillRule="evenodd" d="M6 17a4 4 0 014-4h.5a1 1 0 000-2H10a6 6 0 00-6 6v1h8.5a1 1 0 000-2H6v-1zM15 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3">Pasien</span>
                  {isActive("/admin/pasien") && (
                    <div className="ml-auto w-1 h-6 bg-green-900 rounded-l"></div>
                  )}
                </Link>
              </li>

              <li>
                <div className="my-2 border-t border-gray-200 dark:border-gray-700" />
              </li>

              <li>
                <Link
                  to="/admin/pemeriksaan"
                  className={`flex items-center p-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                    isActive("/admin/pemeriksaan")
                      ? "bg-green-50 text-green-900"
                      : "text-gray-700 hover:bg-green-50 hover:text-green-900"
                  }`}
                >
                  <svg className={`w-5 h-5 transition-colors duration-200 ${
                    isActive("/admin/pemeriksaan") ? "text-green-900" : "text-gray-500 group-hover:text-green-900"
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v1H5a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2H8v-1zm2-7a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1H8a1 1 0 110-2h1V6a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3">Pemeriksaan</span>
                  {isActive("/admin/pemeriksaan") && (
                    <div className="ml-auto w-1 h-6 bg-green-900 rounded-l"></div>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  to="/admin/transaksi"
                  className={`flex items-center p-3 text-sm font-medium rounded-lg transition-all duration-200 group ${
                    isActive("/admin/transaksi")
                      ? "bg-green-50 text-green-900"
                      : "text-gray-700 hover:bg-green-50 hover:text-green-900"
                  }`}
                >
                  <svg className={`w-5 h-5 transition-colors duration-200 ${
                    isActive("/admin/transaksi") ? "text-green-900" : "text-gray-500 group-hover:text-green-900"
                  }`} fill="currentColor" viewBox="0 0 20 20">
                    <path d="M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z" />
                    <path fillRule="evenodd" d="M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z" clipRule="evenodd" />
                  </svg>
                  <span className="ml-3">Transaksi</span>
                  {isActive("/admin/transaksi") && (
                    <div className="ml-auto w-1 h-6 bg-green-900 rounded-l"></div>
                  )}
                </Link>
              </li>
            </ul>
            
            
            {/* Logout Button */}
            <div className="mt-4">
              <button
                onClick={handleLogout}
                className="w-full flex items-center p-3 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-all duration-200 group"
              >
                <svg className="w-5 h-5 group-hover:rotate-180 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                </svg>
                <span className="ml-3">Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="p-3 sm:p-4 md:ml-64 lg:ml-64 h-auto pt-16 sm:pt-20 transition-all duration-300">
          <div className="rounded-lg h-auto px-2 sm:px-4 pt-4 pb-6">
            <Outlet />
          </div>
        </main>

        {/* Mobile Overlay */}
        {isSidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-gray-900 bg-opacity-50 md:hidden backdrop-blur-sm transition-opacity duration-300"
            onClick={toggleSidebar}
            aria-label="Close sidebar"
          ></div>
        )}
      </div>

      {/* Custom Styles for animations */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }

        .animate-slideDown {
          animation: slideDown 0.2s ease-out;
        }

        .scrollbar-thin {
          scrollbar-width: thin;
        }

        .scrollbar-thumb-gray-300::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 9999px;
        }

        .scrollbar-track-gray-100::-webkit-scrollbar-track {
          background-color: #f3f4f6;
        }

        ::-webkit-scrollbar {
          width: 6px;
        }

        ::-webkit-scrollbar-track {
          background-color: #f3f4f6;
        }

        ::-webkit-scrollbar-thumb {
          background-color: #d1d5db;
          border-radius: 9999px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background-color: #9ca3af;
        }
      `}</style>
    </>
  );
}