import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { showUser, updateUser } from "../../../_sevices/auth";
import { userImageStorage } from "../../../_api";

export default function EditUser() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formData, setFormdata] = useState({
    username: "",
    email: "",
    password: "",
    role: "dokter",
    foto: null,
  });
  const [showPassword, setShowPassword] = useState(false);
  const [updatePassword, setUpdatePassword] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // URL preview (bisa dari server atau FileReader)
  const [preview, setPreview] = useState(null);
  // URL foto lama dari server
  const [existingFoto, setExistingFoto] = useState(null); 
  const [isDragging, setIsDragging] = useState(false);
  //ganti foto
  const [updateFoto, setUpdateFoto] = useState(false); 
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const UserData = await showUser(id);
        setFormdata({
          username: UserData.data.username,
          email: UserData.data.email,
          password: "",
          role: UserData.data.role,
        });

        if (UserData.data.foto) {
          const fotoUrl = `${userImageStorage}/${UserData.data.foto}`;
          setExistingFoto(UserData.data.foto);
          setPreview(fotoUrl);
        }

        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching data:", error);
        alert("Gagal memuat data");
        navigate("/admin/users");
      }
    };
    fetchData();
  }, [id, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormdata({ ...formData, [name]: value });
  };

  // Handler ubah foto
  const handleFileChange = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      alert("File harus berupa gambar (JPG, PNG, WEBP).");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      return;
    }
    setFormdata((prev) => ({ ...prev, foto: file }));
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files[0]) handleFileChange(e.dataTransfer.files[0]);
  };

  const removeNewPhoto = () => {
    // Kembali ke foto lama
    setFormdata((prev) => ({ ...prev, foto: null }));
    setPreview(existingFoto);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const cancelUpdateFoto = () => {
    setUpdateFoto(false);
    setFormdata((prev) => ({ ...prev, foto: null }));
    setPreview(existingFoto);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append("_method", "PUT");
      submitData.append("username", formData.username);
      submitData.append("email", formData.email);
      submitData.append("role", formData.role);

      if (updatePassword && formData.password) {
        submitData.append("password", formData.password);
      }
      if (updateFoto && formData.foto) {
        submitData.append("foto", formData.foto);
      }

      // DEBUG: lihat isi FormData sebelum dikirim
      for (let [key, value] of submitData.entries()) {
        console.log(key, value);
      }

      await updateUser(id, submitData);
      navigate("/admin/users");
    } catch (error) {
      console.error("Full error:", error.response); // lihat detail response
      if (error.response?.data) {
        alert(JSON.stringify(error.response.data));
      } else {
        alert("edit user error");
      }
    }
  };

  const handleReset = () => {
    setFormdata({ username: "", foto: null, email: "", password: "", role: "dokter" });
    setPreview(existingFoto);
    setShowPassword(false);
    setUpdatePassword(false);
    setUpdateFoto(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  if (isLoading) {
    return (
      <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-green-900"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Memuat data...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-2xl px-4 py-6 mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">Form Untuk Mengedit Petugas</h2>
          </div>
          <button
            onClick={() => navigate("/admin/users")}
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
                    <h3 className="text-sm font-semibold text-center text-green-900 dark:text-green-300 mb-1">Mode Edit</h3>
                    <p className="text-sm text-center text-green-800 dark:text-green-400">
                      Kosongkan password jika tidak ingin mengubahnya. Foto hanya diperbarui jika mengaktifkan opsi ganti foto.
                    </p>
                  </div>
                </div>
              </div>

              {/* Username */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
                    </svg>
                  </div>
                  <div>
                    <label htmlFor="username" className="block text-sm font-semibold text-gray-900 dark:text-white">
                      Username
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ubah nama pengguna</p>
                  </div>
                </div>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  id="username"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                  placeholder="Masukkan username"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-semibold text-gray-900 dark:text-white">
                      Email
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Ubah email untuk login user</p>
                  </div>
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  id="email"
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-3 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                  placeholder="contoh@example.com"
                  required
                />
              </div>
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <label htmlFor="role" className="block text-sm font-semibold text-gray-900 dark:text-white">
                      Role
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Pilih role pengguna</p>
                  </div>
                </div>

                {/* Dropdown Role */}
                <select
                  name="role"
                  id="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg 
                  focus:ring-2 focus:ring-green-500 focus:border-green-500 block w-full p-3 
                  dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                >
                  <option value="">-- Pilih Role --</option>
                  <option value="admin">Admin</option>
                  <option value="dokter">Dokter</option>
                </select>
              </div>

              {/* Update Password Toggle */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                <input
                  type="checkbox"
                  id="updatePassword"
                  checked={updatePassword}
                  onChange={(e) => setUpdatePassword(e.target.checked)}
                  className="w-4 h-4 text-green-600 bg-gray-100 border-gray-300 rounded focus:ring-green-500 dark:bg-gray-700 dark:border-gray-600"
                />
                <label htmlFor="updatePassword" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
                  Update Password
                </label>
                <span className="text-xs text-gray-500 dark:text-gray-400">(Centang jika ingin mengubah password)</span>
              </div>

              {/* Password */}
              {updatePassword && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <label htmlFor="password" className="block text-sm font-semibold text-gray-900 dark:text-white">
                        Password Baru <span className="text-red-500">*</span>
                      </label>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Minimal 8 karakter</p>
                    </div>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      id="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 block w-full p-3 pr-12 dark:bg-gray-700 dark:border-gray-600 dark:text-white transition-all duration-200"
                      placeholder="Masukkan password baru"
                      minLength="8"
                      required={updatePassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{formData.password.length} karakter</p>
                </div>
              )}

              {/* ===== FOTO PROFIL ===== */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                      <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Foto Profil</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">JPG, PNG atau WEBP — maks. 2MB</p>
                    </div>
                  </div>
                  {/* Toggle ganti foto */}
                  <button
                    type="button"
                    onClick={() => updateFoto ? cancelUpdateFoto() : setUpdateFoto(true)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-medium transition-all duration-200 ${
                      updateFoto
                        ? "border-red-300 text-red-600 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20"
                        : "border-green-300 text-green-600 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-900/20"
                    }`}
                  >
                    {updateFoto ? "Batal Ganti" : "Ganti Foto"}
                  </button>
                </div>

                {/* Foto existing (tidak sedang update) */}
                {!updateFoto ? (
                  <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl">
                    {preview ? (
                      <img
                        src={preview}
                        alt="Foto profil"
                        className="w-16 h-16 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Foto saat ini</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Klik "Ganti Foto" untuk mengubah</p>
                    </div>
                  </div>
                ) : (
                  /* Drop zone — hanya muncul saat updateFoto aktif */
                  <div>
                    <div
                      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                      onDragLeave={() => setIsDragging(false)}
                      onDrop={handleDrop}
                      onClick={() => !formData.foto && fileInputRef.current?.click()}
                      className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all duration-200
                        ${isDragging ? "border-green-400 bg-green-50 dark:bg-green-900/20" : "border-gray-300 dark:border-gray-600"}
                        ${!formData.foto ? "cursor-pointer hover:border-green-400 hover:bg-gray-50 dark:hover:bg-gray-700/30" : ""}
                      `}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileChange(e.target.files[0])}
                      />

                      {!formData.foto ? (
                        <div>
                          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seret foto baru ke sini</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">atau klik untuk pilih file</p>
                          <span className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400">
                            Pilih File
                          </span>
                        </div>
                      ) : (
                        <div>
                          <div className="relative inline-block">
                            <img
                              src={preview}
                              
                              alt="Preview baru"
                              className="w-20 h-20 rounded-full object-cover border-2 border-green-300 dark:border-green -700"
                            />
                            <button
                              type="button"
                              onClick={(e) => { e.stopPropagation(); removeNewPhoto(); }}
                              className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center"
                            >
                              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mt-2">
                            {formData.foto.name.length > 30 ? formData.foto.name.slice(0, 27) + "..." : formData.foto.name}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {(formData.foto.size / 1024).toFixed(1)} KB
                          </p>
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="mt-2 text-xs text-blue-600 hover:underline dark:text-blue-400"
                          >
                            Ganti foto lagi
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Badge foto lama */}
                    {existingFoto && !formData.foto && (
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                        Foto lama tetap digunakan jika tidak ada file baru dipilih
                      </p>
                    )}
                  </div>
                )}
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
                className="inline-flex items-center gap-2 px-6 py-2.5 text-sm font-medium text-white bg-green-700 rounded-lg hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 dark:bg-green-900 dark:hover:bg-green-800 transition-all duration-200 shadow-md hover:shadow-lg"
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