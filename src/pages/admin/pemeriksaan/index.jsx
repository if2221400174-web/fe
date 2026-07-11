import { useEffect, useState} from "react";
import { Link } from "react-router-dom";
import { getPemeriksaan, deletePemeriksaan, updatePemeriksaan } from "../../../_sevices/pemeriksaan";
import { createResep, deleteResep } from "../../../_sevices/resep";
import { getDetailResep, createDetailResep, deleteDetailResep, updateDetailResep } from "../../../_sevices/detailResep";
import { getObat } from "../../../_sevices/obat";
import { getTransaksiByPemeriksaan, updateTransaksi } from "../../../_sevices/transaksi";
import { userImageStorage } from "../../../_api";

const formatTanggal = (tanggal) =>
  new Date(tanggal).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const formatRupiah = (angka) =>
  "Rp " + Number(angka).toLocaleString("id-ID");

const initialsOf = (name = "") =>
  name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

const emptyRow = () => ({ id: Date.now(), obat_id: "", aturan_pakai: "", isNew: true });

const syncTransaksiAfterResep = async (pemeriksaanId, updatedDetailResep, daftarObat) => {
  try {
    const transaksiList = await getTransaksiByPemeriksaan(pemeriksaanId);
    const transaksi = Array.isArray(transaksiList)
      ? transaksiList[0]
      : transaksiList;
    if (!transaksi?.id) return;

    const obatMap = Object.fromEntries(daftarObat.map((o) => [String(o.id), o]));
    const totalHargaObat = updatedDetailResep.reduce((sum, d) => {
      const obatId = String(d.obat?.id ?? d.obat_id ?? "");
      const harga = Number(obatMap[obatId]?.harga_obat ?? d.obat?.harga_obat ?? 0);
      return sum + harga;
    }, 0);

    await updateTransaksi(transaksi.id, {
      total_harga_obat: totalHargaObat,
    });
  } catch (err) {
    console.warn("[syncTransaksi] Dilewati:", err?.message ?? err);
  }
};

function ObatRow({ row, daftarObat, onChange, onRemove, showRemove }) {
  return (
    <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
      <select
        value={row.obat_id}
        onChange={(e) => onChange(row.id, "obat_id", e.target.value)}
        className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        <option value="">-- Pilih Obat --</option>
        {daftarObat.map((o) => (
          <option key={o.id} value={o.id}>
            {o.nama_obat} — {formatRupiah(o.harga_obat)}
          </option>
        ))}
      </select>
      <input
        type="text"
        placeholder="cth: 3x sehari sesudah makan"
        value={row.aturan_pakai}
        onChange={(e) => onChange(row.id, "aturan_pakai", e.target.value)}
        className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400"
      />
      {showRemove ? (
        <button
          type="button"
          onClick={() => onRemove(row.id)}
          className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
          aria-label="Hapus baris"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ) : (
        <span className="w-7" />
      )}
    </div>
  );
}

// ─── TambahResepPanel ─────────────────────────────────────────────────────────

function TambahResepPanel({ pemeriksaanId, daftarObat, onSaved, onCancel }) {
  const [rows, setRows] = useState([emptyRow()]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (rowId, field, value) =>
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)));

  const handleAddRow = () => setRows((prev) => [...prev, emptyRow()]);
  const handleRemoveRow = (rowId) => setRows((prev) => prev.filter((r) => r.id !== rowId));

  const handleSave = async () => {
    const invalid = rows.some((r) => !r.obat_id || !r.aturan_pakai.trim());
    if (invalid) {
      setError("Lengkapi semua baris obat sebelum menyimpan.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const resepResponse = await createResep({ pemeriksaan_id: pemeriksaanId });
      const resepData = resepResponse?.data ?? resepResponse;
      const resepId = resepData?.id;
      if (!resepId) throw new Error("Gagal mendapatkan ID resep dari server.");

      await createDetailResep({
        resep_id: resepId,
        items: rows.map((r) => ({
          obat_id: Number(r.obat_id),
          aturan_pakai: r.aturan_pakai,
        })),
      });

      await syncTransaksiAfterResep(pemeriksaanId, rows, daftarObat);

      onSaved();
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan resep. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/20 px-5 py-4">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Resep Obat
      </p>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2">
        <span className="text-xs text-gray-400 dark:text-gray-500">Obat</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">Aturan pakai</span>
        <span className="w-7" />
      </div>
      <div className="space-y-2 mb-3">
        {rows.map((row) => (
          <ObatRow
            key={row.id}
            row={row}
            daftarObat={daftarObat}
            onChange={handleChange}
            onRemove={handleRemoveRow}
            showRemove={rows.length > 1}
          />
        ))}
      </div>
      <button
        type="button"
        onClick={handleAddRow}
        className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 hover:underline mb-4"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Tambah obat
      </button>
      {error && <p className="text-xs text-red-500 dark:text-red-400 mb-3">{error}</p>}
      <div className="flex items-center gap-2 justify-end">
        <button type="button" onClick={onCancel} disabled={saving}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          Batal
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-green-700 hover:bg-green-800 dark:bg-green-700 dark:hover:bg-green-600 rounded-md transition-colors disabled:opacity-60">
          {saving ? (
            <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Menyimpan...</>
          ) : (
            <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>Simpan Resep</>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── EditPemeriksaanPanel ─────────────────────────────────────────────────────

function EditPemeriksaanPanel({ pemeriksaan, onSaved, onCancel }) {
  const [form, setForm] = useState({
    keluhan: pemeriksaan.keluhan ?? "",
    diagnosa: pemeriksaan.diagnosa ?? "",
    catatan: pemeriksaan.catatan ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSave = async () => {
    if (!form.keluhan.trim() || !form.diagnosa.trim()) {
      setError("Keluhan dan diagnosa wajib diisi.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await updatePemeriksaan(pemeriksaan.id, form);
      onSaved();
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan perubahan. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/20 px-5 py-4">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Edit Pemeriksaan
      </p>
      <div className="space-y-3 mb-4">
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Keluhan Pasien</label>
          <textarea rows={2} value={form.keluhan}
            onChange={(e) => handleChange("keluhan", e.target.value)}
            className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400 resize-none"
            placeholder="Keluhan pasien..." />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">Diagnosa</label>
          <textarea rows={2} value={form.diagnosa}
            onChange={(e) => handleChange("diagnosa", e.target.value)}
            className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400 resize-none"
            placeholder="Diagnosa dokter..." />
        </div>
        <div>
          <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
            Catatan Edukasi<span className="text-gray-400">(opsional)</span>
          </label>
          <textarea rows={2} value={form.catatan}
            onChange={(e) => handleChange("catatan", e.target.value)}
            className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400 resize-none"
            placeholder="Catatan tambahan..." />
        </div>
      </div>
      {error && <p className="text-xs text-red-500 dark:text-red-400 mb-3">{error}</p>}
      <div className="flex items-center gap-2 justify-end">
        <button type="button" onClick={onCancel} disabled={saving}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          Batal
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-green-700 hover:bg-green-800 rounded-md transition-colors disabled:opacity-60">
          {saving ? (
            <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Menyimpan...</>
          ) : (
            <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>Simpan</>
          )}
        </button>
      </div>
    </div>
  );
}

function EditResepPanel({ pemeriksaanId, daftarObatResep, daftarObat, onSaved, onCancel }) {
  const [rows, setRows] = useState(
    daftarObatResep.map((d) => ({
      id: d.id,
      obat_id: String(d.obat?.id ?? d.obat_id ?? ""),
      aturan_pakai: d.aturan_pakai ?? "",
      _deleted: false,
      isNew: false,
    }))
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const resepId = daftarObatResep[0]?.resep_id ?? daftarObatResep[0]?.resep?.id;

  const handleChange = (rowId, field, value) =>
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, [field]: value } : r)));

  const handleMarkDelete = (rowId) =>
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, _deleted: true } : r)));

  const handleUndelete = (rowId) =>
    setRows((prev) => prev.map((r) => (r.id === rowId ? { ...r, _deleted: false } : r)));

  const handleAddRow = () =>
    setRows((prev) => [...prev, emptyRow()]);

  const handleRemoveNewRow = (rowId) =>
    setRows((prev) => prev.filter((r) => r.id !== rowId));

  const activeRows = rows.filter((r) => !r._deleted);

  const handleSave = async () => {
    const invalid = activeRows.some((r) => !r.obat_id || !r.aturan_pakai.trim());
    if (invalid) {
      setError("Lengkapi semua baris obat yang aktif.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      const toDelete = rows.filter((r) => !r.isNew && r._deleted);
      await Promise.all(toDelete.map((r) => deleteDetailResep(r.id)));

      const toUpdate = rows.filter((r) => !r.isNew && !r._deleted);
      await Promise.all(
        toUpdate.map((r) =>
          updateDetailResep(r.id, {
            obat_id: Number(r.obat_id),
            aturan_pakai: r.aturan_pakai,
          })
        )
      );

      const toCreate = rows.filter((r) => r.isNew && !r._deleted);
      if (toCreate.length > 0) {
        if (!resepId) throw new Error("Tidak dapat menemukan ID resep untuk menambah obat baru.");
        await createDetailResep({
          resep_id: resepId,
          items: toCreate.map((r) => ({
            obat_id: Number(r.obat_id),
            aturan_pakai: r.aturan_pakai,
          })),
        });
      }

      await syncTransaksiAfterResep(pemeriksaanId, activeRows, daftarObat);

      onSaved();
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan perubahan resep. Coba lagi.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/20 px-5 py-4">
      <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
        Edit Resep Obat
      </p>
      <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2">
        <span className="text-xs text-gray-400 dark:text-gray-500">Obat</span>
        <span className="text-xs text-gray-400 dark:text-gray-500">Aturan pakai</span>
        <span className="w-7" />
      </div>
      <div className="space-y-2 mb-3">
        {rows.map((row) => {
          if (!row.isNew && row._deleted) {
            return (
              <div key={row.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center opacity-50">
                <span className="text-sm line-through text-gray-400 px-3 py-2">
                  {daftarObat.find((o) => String(o.id) === row.obat_id)?.nama_obat ?? "—"}
                </span>
                <span className="text-sm line-through text-gray-400 px-3 py-2">{row.aturan_pakai}</span>
                <button type="button" onClick={() => handleUndelete(row.id)}
                  className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                  aria-label="Urungkan hapus">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                  </svg>
                </button>
              </div>
            );
          }

          return (
            <div key={row.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
              {row.isNew && (
                <div className="col-span-3 flex items-center gap-1 -mb-1">
                  <span className="text-[10px] font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded px-1.5 py-0.5">
                    + Baru
                  </span>
                </div>
              )}
              <select value={row.obat_id}
                onChange={(e) => handleChange(row.id, "obat_id", e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500">
                <option value="">-- Pilih Obat --</option>
                {daftarObat.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nama_obat} — {formatRupiah(o.harga_obat)}
                  </option>
                ))}
              </select>
              <input type="text" placeholder="cth: 3x sehari sesudah makan"
                value={row.aturan_pakai}
                onChange={(e) => handleChange(row.id, "aturan_pakai", e.target.value)}
                className="w-full text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-500 placeholder-gray-400"
              />
              <button type="button"
                onClick={() => row.isNew ? handleRemoveNewRow(row.id) : handleMarkDelete(row.id)}
                className="p-1.5 text-red-400 hover:text-red-600 dark:hover:text-red-300 transition-colors"
                aria-label="Hapus baris">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          );
        })}
      </div>

      <button type="button" onClick={handleAddRow}
        className="flex items-center gap-1.5 text-xs text-green-700 dark:text-green-400 hover:underline mb-4">
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Tambah obat
      </button>

      {error && <p className="text-xs text-red-500 dark:text-red-400 mb-3">{error}</p>}
      <div className="flex items-center gap-2 justify-end">
        <button type="button" onClick={onCancel} disabled={saving}
          className="px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          Batal
        </button>
        <button type="button" onClick={handleSave} disabled={saving}
          className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-green-700 hover:bg-green-800 dark:bg-green-700 dark:hover:bg-green-600 rounded-md transition-colors disabled:opacity-60">
          {saving ? (
            <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Menyimpan...</>
          ) : (
            <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>Simpan Resep</>
          )}
        </button>
      </div>
    </div>
  );
}


function IconButton({ onClick, disabled, label, variant = "default", children }) {
  const base =
    "relative group rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1";
  const variants = {
    blue: "text-blue-400 hover:text-blue-600 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:ring-blue-400",
    red: "text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 focus:ring-red-400",
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`${base} ${variants[variant]} disabled:opacity-40 disabled:cursor-not-allowed`}
    >
      {children}
      <span className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap rounded bg-green-100 dark:bg-green-900 px-2 py-1 text-[12px] text-green-700 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-lg">
        {label}
      </span>
    </button>
  );
}

function ConfirmInline({ message, onConfirm, onCancel, loading, confirmLabel = "Ya, Hapus" }) {
  return (
    <div className="flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-3 py-1.5">
      <span className="text-xs text-red-600 dark:text-red-400 font-medium">{message}</span>
      <button type="button" onClick={onConfirm} disabled={loading}
        className="px-2.5 py-1 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors disabled:opacity-60">
        {loading ? "Menghapus..." : confirmLabel}
      </button>
      <button type="button" onClick={onCancel} disabled={loading}
        className="px-2.5 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
        Batal
      </button>
    </div>
  );
}

function KartuPemeriksaan({
  pemeriksaan,
  index,
  isOpen,
  onToggle,
  resepMap,
  daftarObat,
  onResepSaved,
  onDeleted,
}) {
  const [showForm, setShowForm] = useState(false);
  const [showEditPemeriksaan, setShowEditPemeriksaan] = useState(false);
  const [showEditResep, setShowEditResep] = useState(false);
  const [deletingPemeriksaan, setDeletingPemeriksaan] = useState(false);
  const [deletingResep, setDeletingResep] = useState(false);
  const [confirmDeletePemeriksaan, setConfirmDeletePemeriksaan] = useState(false);
  const [confirmDeleteResep, setConfirmDeleteResep] = useState(false);

  const resepPemeriksaan = resepMap[pemeriksaan.id] ?? null;
  const sudahAdaResep = resepPemeriksaan !== null;
  const daftarObatResep = resepPemeriksaan ?? [];

  const handleResepSaved = () => {
    setShowForm(false);
    onResepSaved();
  };

  const handleDeletePemeriksaan = async () => {
    setDeletingPemeriksaan(true);
    try {
      await deletePemeriksaan(pemeriksaan.id);
      onDeleted();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingPemeriksaan(false);
      setConfirmDeletePemeriksaan(false);
    }
  };

  const handleDeleteResep = async () => {
    setDeletingResep(true);
    try {
      await Promise.all(daftarObatResep.map((d) => deleteDetailResep(d.id)));
      const resepId = daftarObatResep[0]?.resep_id ?? daftarObatResep[0]?.resep?.id;
      if (resepId) await deleteResep(resepId);
      await syncTransaksiAfterResep(pemeriksaan.id, [], daftarObat);
      onResepSaved();
    } catch (err) {
      console.error(err);
    } finally {
      setDeletingResep(false);
      setConfirmDeleteResep(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">

      {/* ── Header kartu ── */}
      <div className="relative">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-6 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors duration-150 text-left gap-1"
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-full bg-green-700 dark:bg-green-800 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-white">{index + 1}</span>
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold text-gray-900 dark:text-white">
                Pemeriksaan {formatTanggal(pemeriksaan.tanggal_pemeriksaan)}
              </p>
              <p className="text-xs font-medium text-green-700 dark:text-green-400 mt-0.5">
                {pemeriksaan.rekam_medis?.pasien?.nama ?? "—"}
              </p>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Pemeriksa:&nbsp;
                  <span className="font-medium text-gray-700 dark:text-gray-300">
                    {pemeriksaan.user?.username ?? "—"}
                  </span>
                </span>
                <span className="hidden sm:inline text-gray-300 dark:text-gray-600">·</span>
                {sudahAdaResep ? (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                    {daftarObatResep.length} Obat
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                    Belum ada resep
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 z-10">
            <div className="flex items-center gap-0.5 z-10">
              <IconButton
                label="Edit Pemeriksaan"
                variant="blue"
                onClick={(e) => { e.stopPropagation(); setShowEditPemeriksaan(true); }}
                disabled={showEditPemeriksaan}
                >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </IconButton>

              {/* Hapus pemeriksaan */}
              <IconButton
                label="Hapus Pemeriksaan"
                variant="red"
                onClick={(e) => { e.stopPropagation(); setConfirmDeletePemeriksaan(true); }}
                disabled={confirmDeletePemeriksaan}
                >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </IconButton>
            </div>
          </div>
        </button>
      </div>

      {/* ── Confirm delete pemeriksaan ── */}
      {confirmDeletePemeriksaan && (
        <div className="px-3 py-1 border-t border-gray-100 dark:border-gray-700 bg-red-50/50 dark:bg-red-900/10">
          <ConfirmInline
            message="Yakin hapus pemeriksaan ini?"
            onConfirm={handleDeletePemeriksaan}
            onCancel={() => setConfirmDeletePemeriksaan(false)}
            loading={deletingPemeriksaan}
          />
        </div>
      )}

      {/* ── Accordion content ── */}
      {isOpen && (
        <div className="border-t border-gray-100 dark:border-gray-700">

          {/* Keluhan & Diagnosa */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-gray-100 dark:divide-gray-700">
            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-500 uppercase tracking-wider mb-2">
                Keluhan Pasien
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                {pemeriksaan.keluhan || "—"}
              </p>
            </div>
            <div className="px-5 py-4">
              <p className="text-xs font-semibold text-gray-900 dark:text-gray-500 uppercase tracking-wider mb-2">
                Diagnosa
              </p>
              <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed">
                {pemeriksaan.diagnosa || "—"}
              </p>
            </div>
          </div>

          {pemeriksaan.catatan && (
            <div className="mx-5 mb-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800/50 rounded-lg px-4 py-3">
              <p className="text-xs font-medium text-bold text-center text-green-900 dark:text-green-400 uppercase tracking-wider mb-1.5">
                Catatan Edukasi
              </p>
              <p className="text-sm text-center text-green-700 dark:text-green-200 leading-relaxed">
                {pemeriksaan.catatan}
              </p>
            </div>
          )}

          {/* Panel Edit Pemeriksaan */}
          {showEditPemeriksaan && (
            <EditPemeriksaanPanel
              pemeriksaan={pemeriksaan}
              onSaved={() => { setShowEditPemeriksaan(false); onResepSaved(); }}
              onCancel={() => setShowEditPemeriksaan(false)}
            />
          )}

          {/* ── Resep Obat section ── */}
          <div className="px-5 pb-4">
            {/* Judul + tombol aksi resep dalam satu baris */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-500 uppercase tracking-wider">
                Resep Obat
              </p>

              {/* Tombol aksi resep — di sebelah kanan judul */}
              <div className="flex items-center gap-2">
                {sudahAdaResep && !showEditResep && (
                  <>
                    {/* Edit resep */}
                    <div
                      onClick={() => setShowEditResep(true)}
                      disabled={showEditResep}
                      className="inline-flex items-center gap-"
                    >
                      <button className="hidden md:inline text-[10px] text-blue-700 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded px-1.5 py-0.5">
                        Edit Resep
                      </button>
                      <svg className="w-5 h-5 md:hidden text-blue-500 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 focus:ring-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                      </svg>
                    </div>

                    {/* Hapus resep */}
                    <div
                      onClick={() => setConfirmDeleteResep(true)}
                      disabled={confirmDeleteResep}
                    >
                      <svg className="w-5 h-5 text-red-400 hover:text-red-600 dark:hover:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 focus:ring-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </div>
                  </>
                )}

                {/* Tambah resep — jika belum ada & form belum terbuka */}
                {!sudahAdaResep && !showForm && (
                  <button
                    type="button"
                    onClick={() => setShowForm(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 border border-green-200 dark:border-green-800 rounded-md transition-colors"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Tambah Resep
                  </button>
                )}
              </div>
            </div>

            {/* Confirm hapus resep — tampil di bawah judul */}
            {confirmDeleteResep && (
              <div className="mb-3">
                <ConfirmInline
                  message="Yakin hapus resep ini? Total transaksi akan diperbarui."
                  onConfirm={handleDeleteResep}
                  onCancel={() => setConfirmDeleteResep(false)}
                  loading={deletingResep}
                />
              </div>
            )}

            {!sudahAdaResep && !showForm && (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                Pemeriksaan ini belum memiliki resep obat dari dokter.
              </p>
            )}

            {sudahAdaResep && daftarObatResep.length > 0 && !showEditResep && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm text-left min-w-[500px]">
                    <thead>
                      <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-900 dark:text-gray-400 uppercase tracking-wider w-10">No.</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-900 dark:text-gray-400 uppercase tracking-wider">Nama Obat</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-900 dark:text-gray-400 uppercase tracking-wider">Aturan Pakai</th>
                        <th className="px-4 py-2.5 text-xs font-semibold text-gray-900 dark:text-gray-400 uppercase tracking-wider text-right">Harga</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {daftarObatResep.map((detail, i) => (
                        <tr key={detail.id}>
                          <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500 font-medium">{i + 1}</td>
                          <td className="px-4 py-3 text-gray-900 dark:text-white">{detail.obat?.nama_obat ?? "—"}</td>
                          <td className="px-4 py-3 text-gray-600 dark:text-gray-300 capitalize">{detail.aturan_pakai ?? "—"}</td>
                          <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-right">
                            {detail.obat?.harga_obat ? formatRupiah(detail.obat.harga_obat) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {sudahAdaResep && daftarObatResep.length === 0 && (
              <p className="text-xs text-gray-400 dark:text-gray-500 italic">
                Resep tidak memiliki detail obat.
              </p>
            )}
          </div>

          {/*tambah resep */}
          {showForm && (
            <TambahResepPanel
              pemeriksaanId={pemeriksaan.id}
              daftarObat={daftarObat}
              onSaved={handleResepSaved}
              onCancel={() => setShowForm(false)}
            />
          )}

          {/*edit resep */}
          {showEditResep && (
            <EditResepPanel
              pemeriksaanId={pemeriksaan.id}
              daftarObatResep={daftarObatResep}
              daftarObat={daftarObat}
              onSaved={() => { setShowEditResep(false); onResepSaved(); }}
              onCancel={() => setShowEditResep(false)}
            />
          )}

          {/* Footer kartu */}
          <div className="flex items-center justify-between gap-3 px-5 py-3 bg-gray-50 dark:bg-gray-700/20 border-t border-gray-100 dark:border-gray-700">

            {/* LEFT: USER INFO */}
            <div className="flex items-center gap-2.5 min-w-0">
              
              {/* FOTO */}
              <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center overflow-hidden flex-shrink-0 border border-gray-300 dark:border-gray-500">
                {pemeriksaan.user?.foto ? (
                  <img
                    src={`${userImageStorage}/${pemeriksaan.user.foto}`}
                    alt={pemeriksaan.user.username}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-semibold text-gray-500 dark:text-gray-300">
                    {initialsOf(pemeriksaan.user?.username)}
                  </span>
                )}
              </div>

              {/* TEXT */}
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                  {pemeriksaan.user?.username ?? "—"}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 capitalize truncate">
                  {pemeriksaan.user?.role ?? "—"}
                </p>
              </div>
            </div>

            {/* RIGHT: BUTTON */}
            <Link
              to={`/admin/transaksi/create/${pemeriksaan.id}`}
              className="flex-shrink-0 inline-flex items-center justify-center gap-1 px-3 py-1 text-xs font-semibold text-white bg-green-700 hover:bg-green-700 dark:bg-green-600 dark:hover:bg-green-500 rounded-md transition-colors"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>

              {/* Text bisa disembunyikan di HP kalau perlu */}
              <span>Lakukan Transaksi</span>
            </Link>

          </div>
                  </div>
                )}
              </div>
  );
}


export default function AdminPemeriksaan() {
  const [pemeriksaanList, setPemeriksaanList] = useState([]);
  const [resepMap, setResepMap] = useState({});
  const [daftarObat, setDaftarObat] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  const fetchData = async () => {
    try {
      const [rawPemeriksaan, rawDetailResep, rawObat] = await Promise.all([
        getPemeriksaan(),
        getDetailResep(),
        getObat(),
      ]);
      const sorted = [...rawPemeriksaan].sort(
        (a, b) =>
          new Date(b.created_at ?? b.tanggal_pemeriksaan) -
          new Date(a.created_at ?? a.tanggal_pemeriksaan)
      );
      setPemeriksaanList(sorted);
      setDaftarObat(rawObat);
      const map = {};
      sorted.forEach((p) => { map[p.id] = null; });
      rawDetailResep.forEach((detail) => {
        const pemId = detail.resep?.pemeriksaan_id;
        if (pemId === undefined) return;
        if (map[pemId] === null) map[pemId] = [];
        map[pemId].push(detail);
      });
      setResepMap(map);
      if (sorted.length > 0) setExpanded({ [sorted[0].id]: true });
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const toggleExpanded = (id) =>
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));

  if (loading) {
    return (
      <section className="bg-gray-50 dark:bg-gray-900 min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-green-700 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Memuat data pemeriksaan...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-gray-50 dark:bg-gray-900 min-h-screen">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              Hasil Pemeriksaan
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Catatan pemeriksaan Praktek Dokter Umum dr. Rowi
            </p>
          </div>
        </div>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
            Hasil Semua Pemeriksaan
          </h2>
          <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2.5 py-1 rounded-full font-medium">
            {pemeriksaanList.length} Pemeriksaan
          </span>
        </div>

        {pemeriksaanList.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 text-center py-14">
            <svg className="w-12 h-12 mx-auto text-gray-300 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-sm font-semibold text-gray-700 dark:text-white mb-1">Belum Ada Pemeriksaan</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mb-5">Belum ada catatan pemeriksaan yang tersimpan.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">Tambah pemeriksaan melalui menu daftar pasien.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pemeriksaanList.map((p, index) => (
              <KartuPemeriksaan
                key={p.id}
                pemeriksaan={p}
                index={index}
                isOpen={expanded[p.id] ?? false}
                onToggle={() => toggleExpanded(p.id)}
                resepMap={resepMap}
                daftarObat={daftarObat}
                onResepSaved={fetchData}
                onDeleted={fetchData}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}