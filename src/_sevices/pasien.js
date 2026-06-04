import API from "../_api"

export const getPasien = async() =>{
  const {data} = await API.get("/pasiens")
  return data.data
}

export const createPasien= async (data) => {
  try {
    const response = await API.post("/pasiens",data)
    return response.data
  } catch (error) {
    console.log(error);
    throw error
  }
}

export const showPasien = async (id) => {
  try {
    const response = await API.get(`/pasiens/${id}`)
    return response.data
  } catch (error) {
    console.log(error);
    throw error
  }
}

export const updatePasien = async (id, data) => {
  try {
    const response = await API.put(`/pasiens/${id}`, data)
    return response.data
  } catch (error) {
    console.log(error);
    throw error
  }
}

export const deletePasien = async (id)=>{
  try {
    await API.delete(`/pasiens/${id}`)
  } catch (error) {
    console.log(error);
    throw error
  }
}
