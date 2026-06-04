import { useJwt } from "react-jwt";
import API from "../_api"


export const login = async ({email, password}) => {
  try {
    const{data} = await API.post("/login", {email, password})
    return data
  } catch (error) {
    console.log(error);
    throw error
  }
}

export const logout = async (token) => {
  try {
    const { data } = await API.post("/logout", {token}, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });

    localStorage.removeItem("accessToken");
    localStorage.removeItem("userInfo");
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};


// untuk mengecek token
export const useDecodeToken = (token) => {
  const { decodedToken, isExpired } = useJwt(token);

  try {
    if (isExpired) {
    return {
      success: false,
      message: "Token expired",
      data: null,
    };
  }

  return {
    success: true,
    message: "Token valid",
    data: decodedToken,
  };
  } catch (error) {
    return{
      success: false,
      message: error.message,
      data:null
    }
  }  
}

export const getUser = async() =>{
  const {data} = await API.get("/petugas")
  return data.data
}

export const userCreate = async (data) => {
  try {
    const response = await API.post("/petugas",data)
    return response.data
  } catch (error) {
    console.log(error);
    throw error
  }
}

export const updateUser = async (id, data) => {
  try {
    const response = await API.post(`/petugas/${id}`, data) 
    return response.data
  } catch (error) {
    console.log(error);
    throw error
  }
}


export const deleteUsers = async (id)=>{
  try {
    await API.delete(`/petugas/${id}`)
  } catch (error) {
    console.log(error);
    throw error
  }
}

export const showUser = async (id, data) => {
  try {
    const response = await API.get(`/petugas/${id}`, data)
    return response.data 
  } catch (error) {
    console.log(error);
    throw error
  }
}
//profile
export const getProfile = async () => {
  try {
    const { data } = await API.get("/profile", {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      },
    });
    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};

export const updateProfile = async (formData) => {
  try {
    const { data } = await API.post("/profile/update", formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
        "Content-Type": "multipart/form-data",
      },
    });

    return data;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
