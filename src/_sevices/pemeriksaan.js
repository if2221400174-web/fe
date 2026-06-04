import API from "../_api"

export const getPemeriksaan = async() =>{
  const {data} = await API.get("/pemeriksaan")
  return data.data
}

export const createPemeriksaan= async (data) => {
  try {
    const response = await API.post("/pemeriksaan",data)
    return response.data
  } catch (error) {
    console.log(error);
    throw error
  }
}

export const showPemeriksaan = async (id) => {
  try {
    const response = await API.get(`/pemeriksaan/${id}`)
    console.log("raw response:", response);
    return response.data
  } catch (error) {
    console.log(error);
    throw error
  }
}

export const updatePemeriksaan = async (id, data) => {
  try {
    const response = await API.put(`/pemeriksaan/${id}`, data)
    return response.data
  } catch (error) {
    console.log(error);
    throw error
  }
}

export const deletePemeriksaan = async (id)=>{
  try {
    await API.delete(`/pemeriksaan/${id}`)
  } catch (error) {
    console.log(error);
    throw error
  }
}
