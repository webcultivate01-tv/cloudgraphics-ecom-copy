import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { loginUser, clearError } from "../features/auth/authSlice";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function Login() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, loading, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);

  useEffect(() => { if (user) navigate(user.role === "admin" ? "/admin/dashboard" : "/"); }, [user, navigate]);
  useEffect(() => { if (error) { toast.error(error); dispatch(clearError()); } }, [error, dispatch]);

  return (
    <div className="flex min-h-[calc(100vh-120px)] bg-white">
      {/* Left panel */}
      <div className="hidden md:flex flex-1 bg-gradient-to-br from-red-700 to-red-900 px-12 py-16 flex-col justify-center">
        <div className="flex items-center gap-3 mb-10">
          <span className="text-4xl">🖨️</span>
          <div>
            <p className="text-white font-black text-lg tracking-widest m-0">CLOUD GRAPHICS</p>
            <p className="text-white/60 text-[10px] tracking-[4px] m-0">AMRAVATI</p>
          </div>
        </div>
        <h2 className="text-white text-4xl font-black leading-tight mb-4">Custom Gift Printing<br />Made Easy</h2>
        <p className="text-white/80 text-base leading-relaxed mb-8">Login to browse, order and track your personalized gifts and merchandise.</p>
        <div className="flex flex-col gap-3">
          {["🎨 Upload your design", "🚚 Fast delivery", "💯 Premium quality"].map((f) => (
            <div key={f} className="text-white/90 text-sm font-semibold">{f}</div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <h1 className="text-3xl font-black text-gray-900 mb-1">Welcome Back</h1>
          <p className="text-gray-400 text-sm mb-8">Sign in to your account</p>

          <form onSubmit={(e) => { e.preventDefault(); dispatch(loginUser(form)); }}>
            <div className="mb-5">
              <label className="block text-gray-600 font-semibold text-xs mb-1.5">Email Address</label>
              <input type="email" placeholder="you@example.com" required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-red-700 transition-colors box-border"
                value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="mb-5">
              <label className="block text-gray-600 font-semibold text-xs mb-1.5">Password</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"} placeholder="Your password" required
                  className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-lg text-sm bg-gray-50 outline-none focus:border-red-700 transition-colors box-border"
                  value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                <button type="button" onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer text-base">{showPass ? "🙈" : "👁️"}</button>
              </div>
              <div className="text-right mt-1.5">
                <Link to="/forgot-password" className="text-red-700 text-xs font-semibold hover:underline">Forgot Password?</Link>
              </div>
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-3.5 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold text-sm cursor-pointer border-none transition-colors disabled:opacity-60 mt-1">
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-5">
            Don't have an account?{" "}
            <Link to="/register" className="text-red-700 font-bold hover:underline">Create one</Link>
          </p>
          <div className="border-t border-gray-200 mt-5 pt-4 text-center">
            <Link to="/products" className="text-red-700 font-semibold text-sm hover:underline">Continue as Guest →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
