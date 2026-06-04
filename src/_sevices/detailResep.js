import API from "../_api"

export const getDetailResep = async() =>{
  const {data} = await API.get("/detail-resep")
  return data.data
}

export const createDetailResep= async (data) => {
  try {
    const response = await API.post("/detail-resep",data)
    return response.data
  } catch (error) {
    console.log(error.response.data.message);
    throw error
  }
}

export const showDetailResep = async (id) => {
  try {
    const response = await API.get(`/detail-resep/${id}`)
    return response.data
  } catch (error) {
    console.log(error);
    throw error
  }
}

export const updateDetailResep = async (id, data) => {
  try {
    const response = await API.put(`/detail-resep/${id}`, data)
    return response.data
  } catch (error) {
    console.log(error);
    throw error
  }
}

export const deleteDetailResep = async (id)=>{
  try {
    await API.delete(`/detail-resep/${id}`)
  } catch (error) {
    console.log(error);
    throw error
  }
}
