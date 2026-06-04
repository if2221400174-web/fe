import { useEffect, useState } from "react";
import api from "../services/api";
import ProfileModal from "./ProfileModal";

const ProfileDropdown = () => {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const res = await api.get("/profile");
    setUser(res.data);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const initial = user?.username?.charAt(0)?.toUpperCase();

  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)}>
        {user?.foto ? (
          <img
            src={`http://127.0.0.1:8000/storage/${user.foto}`}
            className="w-10 h-10 rounded-full object-cover"
          />
        ) : (
          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
            {initial}
          </div>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 bg-white shadow rounded w-60">
          <div className="p-3 border-b">
            <p className="font-semibold">{user?.username}</p>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>

          <button
            onClick={() => setShowModal(true)}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Edit Profile
          </button>

          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      )}

      <ProfileModal
        show={showModal}
        setShow={setShowModal}
        user={user}
        refresh={fetchProfile}
      />
    </div>
  );
};

export default ProfileDropdown;