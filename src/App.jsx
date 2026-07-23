import { BrowserRouter, Route, Routes } from "react-router-dom"

import Login from "./pages/auth/login"
import AdminLayout from "./layouts/admin"
import AdminUser from "./pages/admin/users"
import EditUser from "./pages/admin/users/edit"
import CreateUser from "./pages/admin/users/create"
import EditProfile from "./components/EditProfile"
import AdminObat from "./pages/admin/obat"
import CreateObat from "./pages/admin/obat/create"
import EditObat from "./pages/admin/obat/edit"
import AdminPasien from "./pages/admin/pasien"
import CreatePasien from "./pages/admin/pasien/create"
import EditPasien from "./pages/admin/pasien/edit"
import RekamMedisPasien from "./pages/admin/rekam_medis"
import CreatePemeriksaan from "./pages/admin/pemeriksaan/create"
import AdminPemeriksaan from "./pages/admin/pemeriksaan"
import CreateTransaksi from "./pages/admin/transaksi/create"
import AdminTransaksi from "./pages/admin/transaksi"
import Dashboard from "./pages/admin"
import DokterLayout from "./layouts/dokter"
import DashboardDokter from "./pages/dokter"
import DokterObat from "./pages/dokter/obat"
import DokterPasien from "./pages/dokter/pasien"
import RekamMedisPasienDok from "./pages/dokter/rekam_medis"
import DokterPemeriksaan from "./pages/dokter/pemeriksaan"
import CreatePemeriksaanDok from "./pages/dokter/pemeriksaan/create"
import CreateTransaksiDok from "./pages/dokter/transaksi/create"
import DokumenPublik from "./components/DokumenPublik"

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* public */}
        <Route path="/login" element={<Login />} />
        <Route path="/dokumen/:kode_rm" element={<DokumenPublik/>} />

        {/* admin */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Dashboard />} />

          <Route path="users">
            <Route index element={<AdminUser />} />
            <Route path="create" element={<CreateUser />} />
            <Route path="edit/:id" element={<EditUser />} />
          </Route>

          <Route path="obat">
            <Route index element={<AdminObat />} />
            <Route path="create" element={<CreateObat />} />
            <Route path="edit/:id" element={<EditObat />} />
          </Route>

          <Route path="pasien">
            <Route index element={<AdminPasien />} />
            <Route path="create" element={<CreatePasien />} />
            <Route path="edit/:id" element={<EditPasien />} />
          </Route>

          <Route path="rekam-medis/:pasienId" element={<RekamMedisPasien />} />

          <Route path="pemeriksaan">
            <Route index element={<AdminPemeriksaan />} />
            <Route path="create/:pasienId" element={<CreatePemeriksaan />} />
          </Route>

          <Route path="transaksi">
            <Route index element={<AdminTransaksi />} />
            <Route path="create/:pemeriksaanId" element={<CreateTransaksi />} />
          </Route>

          <Route path="profile/edit" element={<EditProfile />} />
        </Route>

        {/* dokter */}
        <Route path="/dokter" element={<DokterLayout />}>
          <Route index element={<DashboardDokter />} />
          <Route path="obat">
            <Route index element={<DokterObat />} />
          </Route>

          <Route path="pasien">
            <Route index element={<DokterPasien/>} />
          </Route>

          <Route path="rekam-medis/:pasienId" element={<RekamMedisPasienDok />} />

          <Route path="pemeriksaan">
            <Route index element={<DokterPemeriksaan />} />
            <Route path="create/:pasienId" element={<CreatePemeriksaanDok/>} />
          </Route>

          <Route path="transaksi">
            <Route path="create/:pemeriksaanId" element={<CreateTransaksiDok/>} />
          </Route>
          <Route path="profile/edit" element={<EditProfile/>} />
        </Route>

      </Routes>
    </BrowserRouter>
  )
}

export default App