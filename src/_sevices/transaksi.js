import API from "../_api";


export const getTransaksi = async () => {
  const { data } = await API.get("/transaksi");
  return data.data;
};

export const getTransaksiByPemeriksaan = async (pemeriksaanId) => {
  try {
    const { data } = await API.get(`/transaksi/pemeriksaan/${pemeriksaanId}`);
    return data.data;
  } catch (error) {
    console.error("Gagal ambil transaksi:", error.response?.data || error.message);
    return null;
  }
};

export const createTransaksi = async (payload) => {
  try {
    const { data } = await API.post("/transaksi", payload);
    return data.data; 
  } catch (error) {
    console.error("Gagal membuat transaksi:", error.response?.data || error.message);
    throw error;
  }
};

export const updateTransaksi = async (id, data) => {
  try {
    const response = await API.put(`/transaksi/${id}`, data)
    return response.data
  } catch (error) {
    console.log(error);
    throw error
  }
}

export const deleteTransaksi = async (id) => {
  try {
    await API.delete(`/transaksi/${id}`)
  } catch (error) {
    console.log(error)
    throw error
  }
}
