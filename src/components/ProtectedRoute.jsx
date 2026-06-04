import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import API from "../_api";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");

  const [isValid, setIsValid] = useState(null); // null = loading

  useEffect(() => {
    const checkAuth = async () => {
      try {
        await API.get("/profile"); // cek token ke backend
        setIsValid(true);
      } catch (error) {
        console.log(error);
        localStorage.removeItem("token");
        setIsValid(false);
      }
    };

    if (token) {
      checkAuth();
    } else {
      setIsValid(false);
    }
  }, [token]);

  // loading
  if (isValid === null) {
    return <div className="p-5">Loading...</div>;
  }

  // tidak valid
  if (!isValid) {
    return <Navigate to="/login" replace />;
  }

  // valid
  return children;
};

export default ProtectedRoute;