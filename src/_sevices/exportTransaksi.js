import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

// Format Rupiah
const formatRupiah = (angka) => "Rp " + Number(angka).toLocaleString("id-ID");

// Helper untuk filter data berdasarkan periode
export const filterDataByPeriod = (data, periodType, month, year) => {
  return data.filter((t) => {
    const tDate = new Date(t.created_at);
    if (periodType === "tahunan") {
      return tDate.getFullYear() === parseInt(year);
    }
    if (periodType === "bulanan") {
      return (
        tDate.getFullYear() === parseInt(year) &&
        tDate.getMonth() + 1 === parseInt(month)
      );
    }
    return true; // "semua"
  });
};

// Hitung total obat
const hitungTotalObat = (t) => {
  const obatList =
    t.pemeriksaan?.resep?.flatMap((r) =>
      r.details?.map((d) => Number(d.obat?.harga_obat ?? 0)) ?? []
    ) ?? [];
  return obatList.reduce((sum, h) => sum + h, 0);
};

// Prepare Data untuk Export (Tabel Standar)
const prepareTableData = (data) => {
  return data.map((t, index) => {
    const namaPasien = t.pemeriksaan?.rekam_medis?.pasien?.nama ?? "—";
    const totalObat = hitungTotalObat(t);
    const tanggal = new Date(t.created_at).toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    return [
      index + 1,
      tanggal,
      namaPasien,
      formatRupiah(totalObat),
      formatRupiah(t.jasa_medis ?? 0),
      formatRupiah(t.total_tarif ?? 0),
    ];
  });
};

// Export ke PDF
export const exportToPDF = (data, fileName) => {
  try {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(16);
    doc.text("Laporan Riwayat Transaksi", 14, 15);
    doc.setFontSize(10);
    doc.text("Klinik Praktek Dokter Umum dr. Rowi", 14, 22);

    const tableData = prepareTableData(data);

    // Menggunakan autoTable yang baru
    autoTable(doc, {
      startY: 30,
      head: [["No", "Tanggal", "Nama Pasien", "Harga Obat", "Jasa Medis", "Total Tarif"]],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [22, 160, 133] },
    });

    doc.save(`${fileName}.pdf`);
  } catch (error) {
    console.error("Gagal export PDF:", error);
    alert("Terjadi kesalahan saat membuat file PDF. Cek console browser.");
  }
};

// Export ke Excel
export const exportToExcel = (data, fileName) => {
  try {
    const tableData = prepareTableData(data);
    const headers = [["No", "Tanggal", "Nama Pasien", "Harga Obat", "Jasa Medis", "Total Tarif"]];
    
    const ws = XLSX.utils.aoa_to_sheet([...headers, ...tableData]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Transaksi");

    XLSX.writeFile(wb, `${fileName}.xlsx`);
  } catch (error) {
    console.error("Gagal export Excel:", error);
    alert("Terjadi kesalahan saat membuat file Excel. Cek console browser.");
  }
};