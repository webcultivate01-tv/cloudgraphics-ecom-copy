import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { updateProfile } from "../features/auth/authSlice";
import { toast } from "react-toastify";

export default function Profile() {
  const dispatch = useDispatch();
  const { user, loading } = useSelector((s) => s.auth);
  const [name, setName] = useState(user?.name || "");
  const [phone, setPhone] = useState(user?.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPwSection, setShowPwSection] = useState(false);

  useEffect(() => { setName(user?.name || ""); setPhone(user?.phone || ""); }, [user]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!name.trim()) { toast.error("Name cannot be empty"); return; }
    if (phone && !/^\d{10}$/.test(phone.trim())) { toast.error("Enter a valid 10-digit phone number"); return; }
    const payload = { name: name.trim(), phone: phone.trim() };
    if (showPwSection) {
      if (!currentPassword) { toast.error("Enter your current password"); return; }
      if (newPassword.length < 6) { toast.error("New password must be at least 6 characters"); return; }
      if (newPassword !== confirmPassword) { toast.error("New passwords do not match"); return; }
      payload.currentPassword = currentPassword;
      payload.newPassword = newPassword;
    }
    const result = await dispatch(updateProfile(payload));
    if (!result.error) {
      toast.success("Profile updated successfully!");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setShowPwSection(false);
    } else { toast.error(result.payload || "Update failed"); }
  };

  const inputCls = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm bg-gray-50 outline-none focus:border-red-700 transition-colors box-border font-[inherit]";

  return (
    <div className="bg-gray-50 min-h-[80vh] px-4 py-10 pb-16">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-7 md:p-10">
        {/* Avatar row */}
        <div className="flex items-center gap-5 mb-8 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-full bg-red-700 text-white flex items-center justify-center text-2xl font-black shrink-0">
            {user?.name?.[0]?.toUpperCase() || "U"}
          </div>
          <div>
            <h1 className="text-xl font-black text-gray-900 m-0">My Profile</h1>
            <p className="text-gray-400 text-sm mt-1">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={handleSave}>
          {/* Personal Info */}
          <div className="mb-7 pb-6 border-b border-gray-100">
            <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest mb-5">Personal Information</h2>
            <div className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Full Name *</label>
                <input className={inputCls} placeholder="Your full name" value={name} onChange={(e) => setName(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email Address</label>
                <input className={`${inputCls} bg-gray-100 text-gray-400 cursor-not-allowed`} value={user?.email || ""} readOnly />
                <p className="text-gray-400 text-xs mt-1">Email address cannot be changed.</p>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Phone Number</label>
                <input className={inputCls} placeholder="10-digit mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} maxLength={10} />
              </div>
            </div>
          </div>

          {/* Password */}
          <div className="mb-7">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xs font-black text-gray-900 uppercase tracking-widest">Password</h2>
              <button type="button" onClick={() => setShowPwSection((v) => !v)}
                className="bg-transparent border border-red-700 text-red-700 rounded-lg px-4 py-1.5 text-xs font-semibold cursor-pointer hover:bg-red-50 transition-colors">
                {showPwSection ? "Cancel" : "Change Password"}
              </button>
            </div>
            {showPwSection && (
              <div className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Current Password *</label>
                  <input type="password" className={inputCls} placeholder="Enter current password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">New Password *</label>
                    <input type="password" className={inputCls} placeholder="Min 6 characters" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Confirm New Password *</label>
                    <input type="password"
                      className={`${inputCls} ${confirmPassword && confirmPassword !== newPassword ? "border-red-500" : ""}`}
                      placeholder="Repeat new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                    {confirmPassword && confirmPassword !== newPassword && <p className="text-red-500 text-xs mt-1">Passwords do not match</p>}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={loading}
              className={`px-9 py-3.5 bg-red-700 hover:bg-red-800 text-white rounded-xl font-bold text-sm border-none cursor-pointer transition-colors ${loading ? "opacity-60 cursor-not-allowed" : ""}`}>
              {loading ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
