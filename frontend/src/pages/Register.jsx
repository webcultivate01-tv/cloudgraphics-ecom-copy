import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { registerUser, clearError } from "../features/auth/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function Register() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "" });

  useEffect(() => { if (user) navigate("/"); }, [user, navigate]);
  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()); } }, [error, dispatch]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return; }
    dispatch(registerUser(form));
  };

  return (
    <div className="flex min-h-[calc(100vh-120px)] bg-white">
      {/* Left panel */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-[#1a1a2e] to-red-700 px-12 py-16 flex-col justify-center">
        <div className="flex items-center gap-3 mb-8">
          <span className="text-4xl">🖨️</span>
          <div>
            <p className="text-white font-black text-lg tracking-widest m-0">CLOUD GRAPHICS</p>
            <p className="text-white/60 text-[10px] tracking-[4px] m-0">AMRAVATI</p>
          </div>
        </div>
        <h2 className="text-white text-4xl font-black leading-tight mb-4">Join Cloud Graphics<br />Today</h2>
        <p className="text-white/80 text-sm leading-relaxed mb-8">Create your free account and start ordering personalized gifts, merchandise, and more.</p>
        <div className="flex flex-col gap-2.5">
          {["📦 Track all your orders", "🎨 Upload custom designs", "🏷️ Exclusive member offers", "🚚 Free delivery on orders"].map((p) => (
            <div key={p} className="text-white/90 text-sm"><span className="text-yellow-400">✓</span> {p}</div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-black text-gray-900 mb-1">Create Account</h1>
          <p className="text-gray-400 text-sm mb-7">It's free and takes only a minute</p>

          <form onSubmit={handleSubmit}>
            {[
              { key: "name", label: "Full Name", type: "text", ph: "Your full name", req: true },
              { key: "email", label: "Email Address", type: "email", ph: "you@example.com", req: true },
              { key: "phone", label: "Phone Number (optional)", type: "tel", ph: "+91 00000 00000", req: false },
              { key: "password", label: "Password (min 6 chars)", type: "password", ph: "Create a strong password", req: true },
            ].map(({ key, label, type, ph, req }) => (
              <div key={key} className="mb-4">
                <label className="block text-gray-600 font-semibold text-xs mb-1.5">{label}</label>
                <input type={type} placeholder={ph} required={req}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-red-700 transition-colors box-border"
                  value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />
              </div>
            ))}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold text-sm cursor-pointer border-none transition-colors disabled:opacity-60 mt-2">
              {loading ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <p className="text-gray-400 text-xs text-center mt-4 leading-relaxed">
            By registering, you agree to our <span className="text-red-700">Terms & Conditions</span> and <span className="text-red-700">Privacy Policy</span>
          </p>
          <p className="text-center text-gray-500 text-sm mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-red-700 font-bold hover:underline">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
