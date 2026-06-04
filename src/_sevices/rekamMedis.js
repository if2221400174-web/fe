import API from "../_api"

export const getRekamMedis = async() =>{
  const {data} = await API.get("/rekam-medis")
  return data.data
}

export const createRekamMedis= async (data) => {
  try {
    const response = await API.post("/rekam-medis",data)
    return response.data
  } catch (error) {
    console.log(error);
    throw error
  }
}

export const showRekamMedis = async (id) => {
  try {
    const response = await API.get(`/rekam-medis/${id}`)
    return response.data
  } catch (error) {
    console.log(error);
    throw error
  }
}

export const updateRekamMedis = async (id, data) => {
  try {
    const response = await API.put(`/rekam-medis/${id}`, data)
    return response.data
  } catch (error) {
    console.log(error);
    throw error
  }
}

export const deleteRekamMedis = async (id)=>{
  try {
    await API.delete(`/rekam-medis/${id}`)
  } catch (error) {
    console.log(error);
    throw error
  }
}
