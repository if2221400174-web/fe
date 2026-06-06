import axios from "axios";
const url = import.meta.env.VITE_API_URL;

const API = axios.create({
  baseURL: `${url}/api`
})

//kirim token
API.interceptors.request.use(config => {
  const token = localStorage.getItem("accessToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }
  return config;
});

// handle token expired
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      
      console.log("Token expired / unauthorized");

      // hapus token
      localStorage.removeItem("accessToken");

      // redirect ke login
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export const userImageStorage = `${url}/storage`;

export default API;