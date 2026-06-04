import API from "../_api"

export const getResep = async () => {
  const { data } = await API.get("/resep")
  return data.data
}

export const createResep = async (data) => {
  try {
    const response = await API.post("/resep", data)
    return response.data
  } catch (error) {
    console.log(error)
    throw error
  }
}

export const deleteResep = async (id) => {
  try {
    await API.delete(`/resep/${id}`)
  } catch (error) {
    console.log(error)
    throw error
  }
}
