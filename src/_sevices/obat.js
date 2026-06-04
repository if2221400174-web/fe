import API from "../_api"

export const getObat = async() =>{
  const {data} = await API.get("/obat")
  return data.data
}

export const createObat= async (data) => {
  try {
    const response = await API.post("/obat",data)
    return response.data
  } catch (error) {
    console.log(error);
    throw error
  }
}

export const showObat = async (id) => {
  try {
    const response = await API.get(`/obat/${id}`)
    return response.data 
  } catch (error) {
    console.log(error);
    throw error
  }
}

export const updateObat = async (id, data) => {
  try {
    const response = await API.post(`/obat/${id}`, data)
    return response.data
  } catch (error) {
    console.log(error);
    throw error
  }
}

export const deleteObat = async (id)=>{
  try {
    await API.delete(`/obat/${id}`)
  } catch (error) {
    console.log(error);
    throw error
  }
}
